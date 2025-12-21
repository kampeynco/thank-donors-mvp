import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ThanksioPostcardRequest {
  front_image_url: string;
  message: string;
  handwriting_style: number;
  recipients: {
    name: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state: string;
    postal_code: string;
  }[];
  return_address: {
    name: string;
    address_line_1: string;
    city: string;
    state: string;
    postal_code: string;
  };
}

async function sendThanksioPostcard(
  thanksioApiKey: string,
  frontImageUrl: string,
  backMessage: string,
  recipient: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
  },
  returnAddress: {
    name: string;
    address1: string;
    city: string;
    state: string;
    zip: string;
  }
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const requestBody: ThanksioPostcardRequest = {
      front_image_url: frontImageUrl,
      message: backMessage,
      handwriting_style: 1,
      recipients: [
        {
          name: recipient.name,
          address_line_1: recipient.address1,
          address_line_2: recipient.address2,
          city: recipient.city,
          state: recipient.state,
          postal_code: recipient.zip,
        },
      ],
      return_address: {
        name: returnAddress.name,
        address_line_1: returnAddress.address1,
        city: returnAddress.city,
        state: returnAddress.state,
        postal_code: returnAddress.zip,
      },
    };

    const response = await fetch("https://api.thanks.io/api/v2/send/postcard/6x9", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${thanksioApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Thanks.io API error:", errorText);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    console.log("Thanks.io response:", data);
    return { success: true, orderId: data.id || data.order_id };
  } catch (error: any) {
    console.error("Thanks.io request failed:", error);
    return { success: false, error: error.message };
  }
}

// @ts-ignore
Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Setup Supabase Client (Service Role required for data ingestion bypassing RLS)
    // @ts-ignore
    const SBASE_URL = Deno.env.get("SBASE_URL");
    // @ts-ignore
    const SBASE_SERVICE_KEY = Deno.env.get("SBASE_SERVICE_KEY");
    // @ts-ignore
    const THANKSIO_API_KEY = Deno.env.get("THANKSIO_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error("Missing Supabase Service Role configuration.");
    }

    if (!THANKSIO_API_KEY) {
      throw new Error("Missing Thanks.io API key configuration.");
    }

    const supabase = createClient(SBASE_URL, SBASE_SERVICE_KEY);

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
            .select('id, profile_id, committee_name, front_image_url, back_message, disclaimer')
            .eq('entity_id', entityId)
            .single();

        if (accountError || !account) {
            console.log(`Entity ID ${entityId} not found in our system. Skipping.`);
            continue;
        }

        console.log(`Processing donation for ${account.committee_name} (Profile: ${account.profile_id})`);

        // Fetch profile for return address
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, address, city, state, zip')
            .eq('id', account.profile_id)
            .single();

        if (profileError || !profile) {
            console.error("Could not fetch profile for return address:", profileError);
            continue;
        }

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

        // 5. Send Postcard via Thanks.io API
        const fullBackMessage = account.disclaimer 
            ? `${account.back_message}\n\n${account.disclaimer}`
            : account.back_message;

        const thanksioResult = await sendThanksioPostcard(
            THANKSIO_API_KEY,
            account.front_image_url || '',
            fullBackMessage || 'Thank you for your generous donation!',
            {
                name: `${donor.firstname} ${donor.lastname}`,
                address1: donor.addr1,
                address2: donor.addr2,
                city: donor.city,
                state: donor.state,
                zip: donor.zip,
            },
            {
                name: profile.full_name || account.committee_name,
                address1: profile.address || '',
                city: profile.city || '',
                state: profile.state || '',
                zip: profile.zip || '',
            }
        );

        // 6. Create Postcard Record with Thanks.io response
        const postcardStatus = thanksioResult.success ? 'SENT' : 'FAILED';
        const { error: postcardError } = await supabase
            .from('postcards')
            .insert({
                donation_id: donation.id,
                profile_id: account.profile_id,
                status: postcardStatus,
                front_image_url: account.front_image_url,
                back_message: account.back_message,
                thanksio_order_id: thanksioResult.orderId || null,
                error_message: thanksioResult.error || null
            });

        if (postcardError) {
            console.error("Error creating postcard record:", postcardError);
        } else {
            console.log(`Postcard ${postcardStatus} - Order ID: ${thanksioResult.orderId || 'N/A'}`);
        }

        // Update donation status based on postcard result
        await supabase
            .from('donations')
            .update({ status: thanksioResult.success ? 'COMPLETED' : 'POSTCARD_FAILED' })
            .eq('id', donation.id);
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