import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { sendPostcardViaLob } from "../webhook-receiver/lob.ts";
import { PRICING } from "../webhook-receiver/processor.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error("Missing Supabase Service Role configuration.");
        }

        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Get the user from the auth header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'No authorization header' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { donationId, address } = await req.json();
        if (!donationId) {
            return new Response(JSON.stringify({ error: 'donationId is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 0. Update address if provided
        if (address) {
            const { error: updateAddrError } = await supabaseAdmin
                .from('donations')
                .update({
                    donor_addr1: address.address_street,
                    donor_city: address.address_city,
                    donor_state: address.address_state,
                    donor_zip: address.address_zip
                })
                .eq('id', donationId);

            if (updateAddrError) {
                console.error("❌ Error updating address before retry:", updateAddrError);
                // We'll continue anyway, but log it
            }
        }

        // 1. Fetch donation, linked account, and entity with security check
        const { data: donation, error: donationError } = await supabaseAdmin
            .from('donations')
            .select(`
                *,
                actblue_accounts!inner(
                    *,
                    actblue_entities!inner(*)
                )
            `)
            .eq('id', donationId)
            .eq('actblue_accounts.profile_id', user.id)
            .single();

        if (donationError || !donation) {
            console.error("❌ Donation fetch/auth error:", donationError);
            return new Response(JSON.stringify({ error: donationError ? donationError.message : 'Donation not found or unauthorized' }), {
                status: donationError?.code === 'PGRST116' ? 404 : 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const account = donation.actblue_accounts;
        const entity = account.actblue_entities;

        if (!entity) {
            return new Response(JSON.stringify({ error: 'Linked entity not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 3. Check status - only retry if failed
        // Note: status is on the 'postcards' table usually, but we check joined info if needed.
        // For now, we'll check the 'postcards' table for the latest entry for this donation.
        const { data: postcard, error: postcardError } = await supabaseAdmin
            .from('postcards')
            .select('*')
            .eq('donation_id', donationId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (postcardError) {
            return new Response(JSON.stringify({ error: 'Postcard record not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (postcard.status !== 'failed' && postcard.status !== 'returned_to_sender') {
            return new Response(JSON.stringify({ error: `Cannot retry postcard with status: ${postcard.status}` }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 4. Re-deduct balance
        const priceCents = PRICING[entity.tier as keyof typeof PRICING] || PRICING.free;
        const { data: updatedEntity, error: deductError } = await supabaseAdmin
            .from('actblue_entities')
            .update({ balance_cents: entity.balance_cents - priceCents })
            .eq('entity_id', entity.entity_id)
            .gte('balance_cents', priceCents)
            .select('balance_cents')
            .single();

        if (deductError || !updatedEntity) {
            return new Response(JSON.stringify({ error: 'Insufficient balance to retry' }), {
                status: 402,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 5. Record transaction
        await supabaseAdmin.from('billing_transactions').insert({
            entity_id: entity.entity_id,
            profile_id: user.id,
            amount_cents: -priceCents,
            type: 'postcard_deduction',
            description: `Postcard RETRY for donor ${donation.donor_firstname} ${donation.donor_lastname}`
        });

        // 6. Prepare data for Lob
        const normalizedDonor = {
            firstname: donation.donor_firstname,
            lastname: donation.donor_lastname,
            email: donation.donor_email,
            addr1: donation.donor_addr1,
            addr2: donation.donor_addr2,
            city: donation.donor_city,
            state: donation.donor_state,
            zip: donation.donor_zip,
            amount: donation.amount
        };

        // Donation date - use created_at of donation
        const donationDate = new Date(donation.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const isTestMode = !!Deno.env.get("LOB_TEST_API_KEY");

        // 7. Call Lob
        const lobResult = await sendPostcardViaLob(normalizedDonor, entity, donationDate, isTestMode, {});

        // 8. If Lob failed again, refund (same as processor.ts)
        if (!lobResult.success) {
            await supabaseAdmin.rpc('increment_entity_balance', {
                p_entity_id: entity.entity_id,
                p_amount: priceCents
            });
        }

        // 9. Update existing postcard record
        const postcardStatus = lobResult.success ? 'processed' : 'failed';
        const { error: updateError } = await supabaseAdmin
            .from('postcards')
            .update({
                status: postcardStatus,
                lob_postcard_id: lobResult.lobId || null,
                lob_url: lobResult.url || null,
                error_message: lobResult.error || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', postcard.id);

        if (updateError) {
            console.error("❌ Error updating postcard record:", updateError);
        }

        // 10. Add event
        await supabaseAdmin.from('postcard_events').insert({
            postcard_id: postcard.id,
            status: postcardStatus,
            details: lobResult.success
                ? 'Postcard successfully retried and sent to Lob.com'
                : `Retry failed: ${lobResult.error}`
        });

        return new Response(JSON.stringify({
            success: lobResult.success,
            status: postcardStatus,
            lobId: lobResult.lobId,
            error: lobResult.error
        }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (err: any) {
        console.error("❌ Retry Function Error:", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
