
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Setup Supabase Client (Service Role required for data ingestion bypassing RLS)
    // @ts-ignore
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    // @ts-ignore
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase Service Role configuration.");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 2. Parse ActBlue Payload
    const payload = await req.json();
    console.log("Received Webhook Payload");

    // ActBlue structure: { contribution: { unique_id, donor: {...}, lineitems: [...] } }
    const contribution = payload.contribution;
    
    if (!contribution || !contribution.lineitems) {
      // Return 200 to acknowledge receipt even if invalid, to stop retries
      console.warn("Invalid payload structure");
      return new Response("Invalid Payload", { status: 200, headers: corsHeaders });
    }

    const actBlueId = contribution.unique_id;
    const donor = contribution.donor;
    const lineItems = contribution.lineitems;

    // 3. Process Line Items
    // A single donation might be split, or specific to one entity.
    // We loop through to find the entity ID that matches one of our accounts.
    
    for (const item of lineItems) {
        const entityId = item.entityId;
        const amount = item.amount; // The amount specific to this entity

        // Find the account in our DB
        // Fetch design templates (front_image_url, back_message) to apply to the postcard
        const { data: account, error: accountError } = await supabase
            .from('actblue_accounts')
            .select('id, profile_id, committee_name, front_image_url, back_message')
            .eq('entity_id', entityId)
            .single();

        if (accountError || !account) {
            console.log(`Entity ID ${entityId} not found in our system. Skipping.`);
            continue;
        }

        console.log(`Processing donation for ${account.committee_name} (Profile: ${account.profile_id})`);

        // 4. Insert Donation Record
        const { data: donation, error: donationError } = await supabase
            .from('donations')
            .insert({
                profile_id: account.profile_id,
                actblue_account_id: account.id,
                actblue_donation_id: actBlueId,
                amount: parseFloat(amount),
                donor_firstname: donor.firstname,
                donor_lastname: donor.lastname,
                donor_email: donor.email,
                donor_address: donor.addr1,
                donor_city: donor.city,
                donor_state: donor.state,
                donor_zip: donor.zip,
                status: 'PENDING' // Donation tracked, postcard pending
            })
            .select()
            .single();

        if (donationError) {
            // Handle duplicate entry gracefully (idempotency)
            if (donationError.code === '23505') { // Unique violation
                console.log("Duplicate donation received. Skipping.");
                continue;
            }
            console.error("Error inserting donation:", donationError);
            throw donationError;
        }

        // 5. Create Postcard Record (Trigger fulfillment workflow)
        // Apply the account's current design settings to this postcard
        const { error: postcardError } = await supabase
            .from('postcards')
            .insert({
                donation_id: donation.id,
                profile_id: account.profile_id,
                status: 'PENDING',
                front_image_url: account.front_image_url, // Use template default from account
                back_message: account.back_message // Use template default from account
            });

        if (postcardError) {
            console.error("Error creating postcard record:", postcardError);
        } else {
            console.log("Postcard queued successfully with campaign design.");
        }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Webhook processing error:", error);
    // We often still return 200 to Hookdeck to prevent it from retrying indefinitely on logic errors
    // unless it's a transient error.
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400, // Or 500 if we want retries
      }
    );
  }
});
