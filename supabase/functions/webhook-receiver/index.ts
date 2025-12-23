
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to substitute variables in message template
function substituteVariables(template: string, donor: any, donationDate: string): string {
  return template
    .replace(/%FIRST_NAME%/g, donor.firstname || 'Friend')
    .replace(/%LAST_NAME%/g, donor.lastname || '')
    .replace(/%FULL_NAME%/g, `${donor.firstname || 'Friend'} ${donor.lastname || ''}`) // Keep FULL_NAME for backward compatibility
    .replace(/%AMOUNT%/g, donor.amount ? `$${donor.amount.toFixed(2)}` : '') // This should be the specific line item amount
    .replace(/%EMAIL%/g, donor.email || '')
    .replace(/%ADDRESS1%/g, donor.addr1 || '')
    .replace(/%ADDRESS2%/g, donor.addr2 || '')
    .replace(/%CITY%/g, donor.city || '')
    .replace(/%STATE%/g, donor.state || '')
    .replace(/%ZIP%/g, donor.zip || '')
    .replace(/%DONATION_DAY%/g, donationDate)
    .replace(/%CURRENT_DAY%/g, new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
}

// Helper function to generate HTML for the postcard back
function generatePostcardHtml(message: string): string {
  // This HTML mimics the frontend preview while adhering to Lob's 4x6 specifications
  return `
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
  <style>
    body {
      width: 6in;
      height: 4in;
      margin: 0;
      padding: 0;
      background: white;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .back-container {
      width: 6in;
      height: 4in;
      position: relative;
      background: white;
      overflow: hidden;
    }
    .message-section {
      position: absolute;
      top: 0.4in;
      left: 0.4in;
      width: 2.6in; /* Reduced slightly to ensure no bleed */
      height: 3.2in;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      box-sizing: border-box;
    }
    .text-body {
      width: 95%;
      max-width: 95%;
      font-size: 11pt;
      line-height: 1.5;
      color: #1c1917;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    /* The right 45% of the card is reserved for the address block and indicia */
  </style>
</head>
<body>
  <div class="back-container">
    <div class="message-section">
      <div class="text-body">${message}</div>
    </div>
  </div>
</body>
</html>
`.trim();
}

// Helper function to generate HTML for the postcard front with disclaimer overlay
function generatePostcardFrontHtml(imageUrl: string, disclaimer: string | null): string {
  return `
<html>
<head>
  <style>
    body {
      width: 6in;
      height: 4in;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #f8fafc;
    }
    .front-container {
      width: 6in;
      height: 4in;
      position: relative;
      background-image: url('${imageUrl}');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }
    .disclaimer-overlay {
      position: absolute;
      bottom: 0.1in; /* Lifted slightly for a cleaner look without background */
      left: 0;
      right: 0;
      background-color: transparent; /* Fully transparent per user request */
      color: white;
      padding: 0 0.4in;
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 8.5pt;
      line-height: 1.3;
      text-align: center;
      letter-spacing: 0.01em;
      text-shadow: 0 1px 2px rgba(0,0,0,0.8); /* Added shadow for readability on any image */
    }
  </style>
</head>
<body>
  <div class="front-container">
    ${disclaimer ? `<div class="disclaimer-overlay">${disclaimer}</div>` : ''}
  </div>
</body>
</html>
`.trim();
}

// Helper function to send postcard via Lob.com API
async function sendPostcardViaLob(
  normalizedDonor: any,
  account: any,
  donationDate: string,
  isTestMode: boolean
): Promise<{ success: boolean; lobId?: string; error?: string }> {
  // @ts-ignore
  const LOB_API_KEY = isTestMode
    ? Deno.env.get("LOB_TEST_API_KEY")
    : Deno.env.get("LOB_LIVE_API_KEY");

  if (!LOB_API_KEY) {
    console.error("❌ Lob API key not found in environment variables");
    return { success: false, error: "Lob API key not configured" };
  }

  console.log(`📡 Preparing Lob request for ${normalizedDonor.firstname} ${normalizedDonor.lastname} (Mode: ${isTestMode ? 'TEST' : 'LIVE'})`);

  // Prepare the back message with variable substitution
  const backMessage = account.back_message
    ? substituteVariables(account.back_message, normalizedDonor, donationDate)
    : `Dear ${normalizedDonor.firstname},\n\nThank you for your generous support!`;

  // Prepare Lob API payload
  const lobPayload = {
    description: `Thank you postcard for ${normalizedDonor.firstname} ${normalizedDonor.lastname}`,
    to: {
      name: `${normalizedDonor.firstname} ${normalizedDonor.lastname}`.trim() || "Donor",
      address_line1: normalizedDonor.addr1,
      address_line2: normalizedDonor.addr2 || undefined,
      address_city: normalizedDonor.city,
      address_state: normalizedDonor.state,
      address_zip: normalizedDonor.zip,
    },
    from: {
      name: account.committee_name || "Campaign",
      address_line1: account.street_address || "123 Main St",
      address_city: account.city || "City",
      address_state: account.state || "ST",
      address_zip: account.postal_code || "12345",
    },
    front: generatePostcardFrontHtml(
      account.front_image_url || "https://via.placeholder.com/1875x1275",
      account.disclaimer
    ),
    back: generatePostcardHtml(backMessage),
    size: "4x6",
    mail_type: "usps_first_class",
  };

  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 1000;

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      console.log(`🚀 Lob API Call (Attempt ${attempt})...`);
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
          console.error(`❌ Lob API Client Error (${response.status}):`, JSON.stringify(result));
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
          console.error("❌ Lob API Error (Final Attempt):", JSON.stringify(result));
          return {
            success: false,
            error: result.error?.message || `Lob API returned ${response.status} after ${attempt} attempts`
          };
        }
      }

      console.log(`✅ Postcard created successfully! Lob ID: ${result.id}`);
      return { success: true, lobId: result.id };

    } catch (error: any) {
      console.warn(`⚠️ Attempt ${attempt} failed: ${error.message}`);

      if (attempt <= MAX_RETRIES) {
        // Exponential backoff: 1s, 2s, 4s
        const backoff = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${backoff}ms...`);
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
    if (payload.body && !payload.contribution && !payload.donor) {
      console.log("📦 Detected wrapped body format (Hookdeck)");
      payload = typeof payload.body === 'string' ? JSON.parse(payload.body) : payload.body;
    }

    const contribution = payload.contribution;
    const donor = payload.donor || contribution?.donor;
    const lineItems = payload.lineitems || payload.lineItems || contribution?.lineitems || contribution?.lineItems || [];

    // Check for orderNumber (primary ActBlue ID)
    const orderNumber = contribution?.orderNumber || contribution?.order_number || payload.orderNumber;
    const createdAt = contribution?.createdAt || contribution?.created_at || payload.createdAt;

    // We strictly require orderNumber as the main ID
    if (!contribution || !donor || lineItems.length === 0 || !orderNumber || !createdAt) {
      console.warn("Invalid payload structure. Payload keys:", Object.keys(payload));
      console.warn("Details - hasContribution:", !!contribution, "hasDonor:", !!donor, "lineItemsCount:", lineItems.length, "orderNumber:", orderNumber, "createdAt:", createdAt);

      return new Response(JSON.stringify({
        error: "Invalid Payload Structure",
        receivedKeys: Object.keys(payload),
        missing: {
          contribution: !contribution,
          donor: !donor,
          lineItems: lineItems.length === 0,
          orderNumber: !orderNumber,
          createdAt: !createdAt
        }
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Use orderNumber as the primary ID
    const actBlueId = orderNumber;

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
      const entityId = item.entityId || item.entity_id;
      const amount = parseFloat(item.amount || "0");
      console.log(`🔍 Checking line item. Entity ID: ${entityId}, Amount: ${amount}`);

      // Find the account in our DB
      const { data: account, error: accountError } = await supabase
        .from('actblue_accounts')
        .select('id, profile_id, committee_name, front_image_url, back_message, disclaimer, street_address, city, state, postal_code')
        .eq('entity_id', entityId)
        .single();

      if (accountError || !account) {
        console.log(`⚠️ Entity ID ${entityId} not found in actblue_accounts. Skipping this line item.`);
        continue;
      }

      console.log(`✅ Found account: ${account.committee_name} (ID: ${account.id})`);

      // Create normalized donor object for this specific contribution
      const normalizedDonor = {
        firstname: donor.firstname || donor.firstName || 'Donor',
        lastname: donor.lastname || donor.lastName || '',
        email: donor.email || '',
        addr1: donor.addr1 || donor.address_line1 || donor.addressLine1 || '',
        addr2: donor.addr2 || donor.address_line2 || donor.addressLine2 || '',
        city: donor.city || '',
        state: donor.state || '',
        zip: donor.zip || donor.postalCode || donor.postal_code || '',
        amount: amount // Store the specific line item amount for templating
      };

      // 4. Insert Donation Record
      console.log("💾 Saving donation record to database...");
      const { data: donation, error: donationError } = await supabase
        .from('donations')
        .insert({
          profile_id: account.profile_id,
          actblue_account_id: account.id,
          actblue_donation_id: actBlueId,
          amount: amount,
          donor_firstname: normalizedDonor.firstname,
          donor_lastname: normalizedDonor.lastname,
          donor_email: normalizedDonor.email,
          donor_addr1: normalizedDonor.addr1,
          donor_city: normalizedDonor.city,
          donor_state: normalizedDonor.state,
          donor_zip: normalizedDonor.zip
        })
        .select()
        .single();

      if (donationError) {
        if (donationError.code === '23505') {
          console.log("ℹ️ Duplicate donation received (ActBlue ID: " + actBlueId + "). Skipping.");
          continue;
        }
        console.error("❌ Error inserting donation:", JSON.stringify(donationError));
        throw donationError;
      }

      // 5. Send Postcard via Lob.com API
      const lobResult = await sendPostcardViaLob(normalizedDonor, account, donationDate, isTestMode);

      // 6. Create Postcard Record with result
      console.log(`📝 Recording postcard status: ${lobResult.success ? 'SENT' : 'FAILED'}`);
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
        console.error("❌ Error creating postcard record:", JSON.stringify(postcardError));
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});