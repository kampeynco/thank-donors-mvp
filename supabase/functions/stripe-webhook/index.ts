
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import Stripe from "https://esm.sh/stripe@14.16.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY") || "", {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const signature = req.headers.get("stripe-signature");
        if (!signature) {
            return new Response("Missing stripe-signature", { status: 400 });
        }

        const body = await req.text();
        const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

        let event;
        try {
            event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret || "");
        } catch (err) {
            console.error(`❌ Webhook signature verification failed: ${err.message}`);
            return new Response(`Webhook Error: ${err.message}`, { status: 400 });
        }

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") || "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
        );

        console.log(`🔔 Received Stripe event: ${event.type}`);

        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                const profileId = session.metadata?.profile_id;
                const entityId = session.metadata?.entity_id;
                const type = session.metadata?.type; // 'topup' or 'subscription'

                if (!profileId) {
                    console.error("❌ Missing profile_id in session metadata");
                    break;
                }

                if (type === "topup") {
                    const amountCents = session.amount_total; // This is the total charged
                    console.log(`💰 Fulfilling topup for ${entityId ? 'entity ' + entityId : 'profile ' + profileId}: ${amountCents} cents`);

                    if (entityId) {
                        // Update Entity Balance
                        const { data: entity, error: fetchError } = await supabase
                            .from('actblue_entities')
                            .select('balance_cents')
                            .eq('entity_id', Number(entityId))
                            .single();

                        if (fetchError) throw fetchError;

                        const newBalance = (entity.balance_cents || 0) + amountCents;
                        const { error: updateError } = await supabase
                            .from('actblue_entities')
                            .update({
                                balance_cents: newBalance,
                                stripe_customer_id: session.customer as string
                            })
                            .eq('entity_id', Number(entityId));

                        if (updateError) throw updateError;
                    } else {
                        // Fallback to Profile Balance (Legacy)
                        const { data: profile, error: fetchError } = await supabase
                            .from('profiles')
                            .select('balance_cents')
                            .eq('id', profileId)
                            .single();

                        if (fetchError) throw fetchError;

                        const newBalance = (profile.balance_cents || 0) + amountCents;
                        await supabase
                            .from('profiles')
                            .update({
                                balance_cents: newBalance,
                                stripe_customer_id: session.customer as string
                            })
                            .eq('id', profileId);
                    }

                    // Record transaction
                    await supabase.from('billing_transactions').insert({
                        profile_id: profileId,
                        entity_id: entityId ? Number(entityId) : null,
                        amount_cents: amountCents,
                        type: 'topup',
                        description: `Credit top-up via Stripe`,
                        stripe_payment_intent_id: session.payment_intent as string
                    });
                }

                if (type === "subscription") {
                    console.log(`🚀 Upgrading ${entityId ? 'entity ' + entityId : 'profile ' + profileId} to Pro tier`);
                    if (entityId) {
                        await supabase
                            .from('actblue_entities')
                            .update({
                                tier: 'pro',
                                stripe_customer_id: session.customer as string
                            })
                            .eq('entity_id', Number(entityId));
                    } else {
                        await supabase
                            .from('profiles')
                            .update({
                                tier: 'pro',
                                stripe_customer_id: session.customer as string
                            })
                            .eq('id', profileId);
                    }
                }
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object;

                // Check if it's an entity subscription
                const { data: entity } = await supabase
                    .from('actblue_entities')
                    .select('entity_id')
                    .eq('stripe_customer_id', subscription.customer)
                    .single();

                if (entity) {
                    console.log(`📉 Downgrading entity ${entity.entity_id} to Free tier`);
                    await supabase
                        .from('actblue_entities')
                        .update({ tier: 'free' })
                        .eq('entity_id', entity.entity_id);
                } else {
                    // Fallback to profile
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('stripe_customer_id', subscription.customer)
                        .single();

                    if (profile) {
                        console.log(`📉 Downgrading user ${profile.id} to Free tier`);
                        await supabase
                            .from('profiles')
                            .update({ tier: 'free' })
                            .eq('id', profile.id);
                    }
                }
                break;
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        console.error(`❌ Webhook error: ${error.message}`);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
