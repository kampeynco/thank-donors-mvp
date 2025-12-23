
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to substitute variables in message template
function substituteVariables(template: string, donor: any, donationDate: string): string {
  return template
    .replace(/%FULL_NAME%/g, `${donor.firstname} ${donor.lastname}`)
    .replace(/%FIRST_NAME%/g, donor.firstname || '')
    .replace(/%LAST_NAME%/g, donor.lastname || '')
    .replace(/%ADDRESS%/g, donor.addr1 || '')
    .replace(/%ADDRESS2%/g, donor.addr2 || '')
    .replace(/%CITY%/g, donor.city || '')
    .replace(/%STATE%/g, donor.state || '')
    .replace(/%ZIP%/g, donor.zip || '')
    .replace(/%DONATION_DAY%/g, donationDate)
    .replace(/%CURRENT_DAY%/g, new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
}

// Helper function to send postcard via Lob.com API
async function sendPostcardViaLob(
  donor: any,
  account: any,
  donationDate: string,
  isTestMode: boolean
): Promise<{ success: boolean; lobId?: string; error?: string }> {
  // @ts-ignore
  const LOB_API_KEY = isTestMode
    ? Deno.env.get("LOB_TEST_API_KEY")
    : Deno.env.get("LOB_LIVE_API_KEY");

  if (!LOB_API_KEY) {
    return { success: false, error: "Lob API key not configured" };
  }

  // Prepare the back message with variable substitution
  const backMessage = account.back_message
    ? substituteVariables(account.back_message, donor, donationDate)
    : `Dear ${donor.firstname},\n\nThank you for your generous support!`;

  // Add disclaimer if present
  const finalBackMessage = account.disclaimer
    ? `${backMessage}\n\n${account.disclaimer}`
    : backMessage;

  // Prepare Lob API payload
  const lobPayload = {
    description: `Thank you postcard for ${donor.firstname} ${donor.lastname}`,
    to: {
      name: `${donor.firstname} ${donor.lastname}`,
      address_line1: donor.addr1,
      address_line2: donor.addr2 || undefined,
      address_city: donor.city,
      address_state: donor.state,
      address_zip: donor.zip,
    },
    from: {
      name: account.committee_name || "Campaign",
      address_line1: account.street_address || "123 Main St",
      address_city: account.city || "City",
      address_state: account.state || "ST",
      address_zip: account.postal_code || "12345",
    },
    front: account.front_image_url || "https://via.placeholder.com/1875x1275",
    back: finalBackMessage,
    size: "6x4",
    mail_type: "usps_first_class",
  };

  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 1000;

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      const response = await fetch("https://api.lob.com/v1/postcards", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(LOB_API_KEY + ":")}`,
          "Content-Type": "application/json",
          "Lob-Version": "2020-02-11",
        },
        body: JSON.stringify(lobPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        // If it's a client error (4xx) that IS NOT 429 (Too Many Requests) or 408 (Timeout), fail immediately.
        // We generally assume 4xx are permanent errors (e.g. invalid address, bad template).
        // 429 and 5xx are worth retrying.
        if (response.status >= 400 && response.status < 500 && response.status !== 429 && response.status !== 408) {
          console.error("Lob API Client Error (Non-Retryable):", result);
          return {
            success: false,
            error: result.error?.message || `Lob API returned ${response.status}`
          };
        }

        // If we have retries left, throw to catch block to handle delay & retry
        if (attempt <= MAX_RETRIES) {
          throw new Error(`Lob API Error ${response.status}: ${result.error?.message || 'Unknown error'}`);
        } else {
          // No retries left
          console.error("Lob API Error (Final Attempt):", result);
          return {
            success: false,
            error: result.error?.message || `Lob API returned ${response.status} after ${attempt} attempts`
          };
        }
      }

      console.log("Postcard sent via Lob:", result.id);
      return { success: true, lobId: result.id };

    } catch (error: any) {
      console.warn(`Attempt ${attempt} failed: ${error.message}`);

      if (attempt <= MAX_RETRIES) {
        // Exponential backoff: 1s, 2s, 4s
        const backoff = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`Waiting ${backoff}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
      } else {
        return { success: false, error: `Failed after ${MAX_RETRIES} retries: ${error.message}` };
      }
    }
  }

  return { success: false, error: "Unexpected loop termination" };
}

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
    let payload = await req.json();
    console.log("Received Webhook Payload. Keys:", Object.keys(payload));

    // Check if Hookdeck wrapped the body
    if (payload.body && !payload.contribution) {
      console.log("📦 Detected wrapped body format (Hookdeck)");
      payload = typeof payload.body === 'string' ? JSON.parse(payload.body) : payload.body;
    }

    // ActBlue structure: { contribution: { unique_id, donor: {...}, lineitems: [...] } }
    // ActBlue structure seems to be flattened or top-level mainly: { contribution: {...}, lineitems: [...], donor: {...} }
    const contribution = payload.contribution;

    // Check for lineitems at ROOT or inside contribution
    const lineItems = payload.lineitems || payload.lineItems || contribution?.lineitems || contribution?.lineItems;

    // Check for orderNumber (primary ActBlue ID) 
    const orderNumber = contribution?.orderNumber || contribution?.order_number;
    const createdAt = contribution?.created_at || contribution?.createdAt;

    // We strictly require orderNumber as the main ID
    if (!contribution || !lineItems || !orderNumber || !createdAt) {
      console.warn("Invalid payload structure. Payload keys:", Object.keys(payload));
      if (contribution) {
        console.warn("Contribution keys:", Object.keys(contribution));
        console.warn("Missing fields - orderNumber:", !orderNumber, "createdAt:", !createdAt, "lineItems:", !lineItems);
      }

      // Return debug info in response
      return new Response(JSON.stringify({
        error: "Invalid Payload Structure",
        receivedKeys: Object.keys(payload),
        bodyType: typeof payload,
        hasBodyProp: !!payload.body,
        contributionKeys: contribution ? Object.keys(contribution) : null,
        missing: { orderNumber: !orderNumber, createdAt: !createdAt, lineItems: !lineItems }
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Use orderNumber as the primary ID
    const actBlueId = orderNumber;
    // Donor might be at root or in contribution
    const donor = payload.donor || contribution.donor;

    // Format the date nicely for the postcard
    let donationDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (createdAt) {
      const dateObj = new Date(createdAt);
      if (!isNaN(dateObj.getTime())) {
        donationDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }
    }

    // Determine if we should use test mode (check for test API key presence)
    // @ts-ignore
    const isTestMode = !!Deno.env.get("LOB_TEST_API_KEY");

    // 3. Process Line Items
    // A single donation might be split, or specific to one entity.
    // We loop through to find the entity ID that matches one of our accounts.

    for (const item of lineItems) {
      // Handle both camelCase and snake_case for item fields if needed, 
      // but code previously assumed entityId (camel). fallback to entity_id just in case.
      const entityId = item.entityId || item.entity_id;
      const amount = item.amount; // The amount specific to this entity

      // Find the account in our DB
      // Fetch design templates and address info for the postcard
      const { data: account, error: accountError } = await supabase
        .from('actblue_accounts')
        .select('id, profile_id, committee_name, front_image_url, back_message, disclaimer, street_address, city, state, postal_code')
        .eq('entity_id', entityId)
        .single();

      if (accountError || !account) {
        console.log(`Entity ID ${entityId} not found in our system. Skipping.`);
        continue;
      }

      console.log(`Processing donation for ${account.committee_name} (Profile: ${account.profile_id})`);

      // Normalize donor fields
      const donorFirstName = donor.firstname || donor.firstName;
      const donorLastName = donor.lastname || donor.lastName;
      const donorEmail = donor.email;
      const donorAddr1 = donor.addr1 || donor.address_line1 || donor.addressLine1;
      const donorCity = donor.city;
      const donorState = donor.state;
      const donorZip = donor.zip || donor.postalCode || donor.postal_code;

      // 4. Insert Donation Record
      const { data: donation, error: donationError } = await supabase
        .from('donations')
        .insert({
          profile_id: account.profile_id,
          actblue_account_id: account.id,
          actblue_donation_id: actBlueId,
          amount: parseFloat(amount),
          donor_firstname: donorFirstName,
          donor_lastname: donorLastName,
          donor_email: donorEmail,
          donor_address: donorAddr1,
          donor_city: donorCity,
          donor_state: donorState,
          donor_zip: donorZip,
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

      // 5. Send Postcard via Lob.com API
      console.log("Sending postcard via Lob.com...");
      const lobResult = await sendPostcardViaLob(donor, account, donationDate, isTestMode);

      // 6. Create Postcard Record with result
      const postcardStatus = lobResult.success ? 'SENT' : 'FAILED';
      const { error: postcardError } = await supabase
        .from('postcards')
        .insert({
          donation_id: donation.id,
          profile_id: account.profile_id,
          status: postcardStatus,
          front_image_url: account.front_image_url,
          back_message: account.back_message,
          lob_postcard_id: lobResult.lobId || null,
          error_message: lobResult.error || null
        });

      if (postcardError) {
        console.error("Error creating postcard record:", postcardError);
      } else {
        if (lobResult.success) {
          console.log(`Postcard sent successfully! Lob ID: ${lobResult.lobId}`);
        } else {
          console.error(`Postcard failed: ${lobResult.error}`);
        }
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