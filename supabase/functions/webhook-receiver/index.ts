
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import Stripe from "https://esm.sh/stripe@14.16.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

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
function generatePostcardHtml(message: string, showBranding: boolean = true): string {
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
      width: 2.7in; /* Reduced slightly to ensure no bleed */
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
    .branding-badge {
      position: absolute;
      top: 15px;
      right: 15px;
      z-index: 50;
      opacity: 0.9;
      width: 64px;
    }

    /* The right 45% of the card is reserved for the address block and indicia */
  </style>
</head>
<body>
  <div class="back-container">
    <div class="message-section">
      <div class="text-body">${message}</div>
    </div>
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
    ${disclaimer ? '<div class="disclaimer-overlay">' + disclaimer + '</div>' : ''}
  </div>
</body>
</html>
`.trim();
}

// Helper function to send postcard via Lob.com API
async function sendPostcardViaLob(
  normalizedDonor: any,
  entity: any,
  donationDate: string,
  isTestMode: boolean,
  overrides: { front_image_url?: string; back_message?: string; disclaimer?: string } = {}
): Promise<{ success: boolean; lobId?: string; url?: string; lobStatus?: string; error?: string }> {
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
  const rawBackMessage = overrides.back_message || entity.back_message;
  const backMessage = rawBackMessage
    ? substituteVariables(rawBackMessage, normalizedDonor, donationDate)
    : `Dear ${normalizedDonor.firstname},\n\nThank you for your generous support!`;

  // Determine branding visibility
  const showBranding = entity.tier === 'free' || (entity.tier === 'pro' && entity.branding_enabled !== false);

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
      name: entity.committee_name || "Campaign",
      address_line1: entity.street_address || "123 Main St",
      address_city: entity.city || "City",
      address_state: entity.state || "ST",
      address_zip: entity.postal_code || "12345",
    },
    front: generatePostcardFrontHtml(
      overrides.front_image_url || entity.front_image_url || "https://via.placeholder.com/1875x1275",
      overrides.disclaimer || entity.disclaimer
    ),
    back: generatePostcardHtml(backMessage, showBranding),
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
      return {
        success: true,
        lobId: result.id,
        url: result.url,
        lobStatus: result.status
      };

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

  let eventId: string | undefined;
  let supabase: any;

  try {
    // 1. Setup Supabase Client (Service Role required for data ingestion bypassing RLS)
    // @ts-ignore
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    // @ts-ignore
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase Service Role configuration.");
    }

    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 2. Parse ActBlue Payload
    let payload = await req.json();
    console.log("Received Webhook Payload. Keys:", Object.keys(payload));

    // 2.a Initial Webhook Event Logger
    const { data: eventRecord, error: eventError } = await supabase
      .from('webhook_events')
      .insert({
        payload,
        status: 'received'
      })
      .select('id')
      .single();

    if (eventError) {
      console.error("❌ Failed to log initial webhook event:", JSON.stringify(eventError));
    }
    eventId = eventRecord?.id;

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
      return new Response(JSON.stringify({
        error: "Invalid Payload Structure",
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
    // A single donation might be split across multiple entities (e.g., tandem fundraiser).
    // We process each line item that belongs to an entity we manage.
    for (const item of lineItems) {
      const entityId = item.entityId || item.entity_id;
      const amount = parseFloat(item.amount || "0");
      console.log(`🔍 Checking line item. Entity ID: ${entityId}, Amount: ${amount}`);

      // 1. Fetch the Entity and its linked Account in a single query
      // This prioritizes the entity as the source of truth for design and billing
      const { data: entity, error: entityError } = await supabase
        .from("actblue_entities")
        .select(`
          entity_id, 
          committee_name, 
          tier, 
          balance_cents, 
          stripe_customer_id, 
          front_image_url, 
          back_message, 
          disclaimer, 
          street_address, 
          city, 
          state, 
          postal_code, 
          branding_enabled,
          actblue_accounts (
            id,
            profile_id
          )
        `)
        .eq("entity_id", entityId)
        .single();

      if (entityError || !entity) {
        console.warn(`⚠️ Entity ID ${entityId} not found or query error: ${entityError?.message}. Skipping.`);
        continue;
      }

      const account = entity.actblue_accounts?.[0];
      if (!account) {
        console.warn(`⚠️ No linked profile found for Entity ID ${entityId}. Skipping.`);
        continue;
      }

      console.log(`✅ Resolved entity: ${entity.committee_name} and profile: ${account.profile_id}`);

      // Update event record with profile_id if we have one
      if (eventId && account.profile_id) {
        await supabase
          .from('webhook_events')
          .update({ profile_id: account.profile_id })
          .eq('id', eventId);
      }

      // 3. Billing Check & Deduction
      // Centralized Billing: Deduct from the entity balance directly
      const priceCents = entity.tier === 'pro' ? 99 : 149;

      if (entity.balance_cents < priceCents) {
        console.warn(`❌ Entity ${entityId} has insufficient balance (${entity.balance_cents}c). Need ${priceCents}c.`);
        // Record failed donation/postcard record could go here if needed.
        continue;
      }

      // Deduct balance from entity
      const { error: deductError } = await supabase
        .from('actblue_entities')
        .update({ balance_cents: entity.balance_cents - priceCents })
        .eq('entity_id', entityId);

      if (deductError) {
        console.error("❌ Failed to deduct balance from entity:", JSON.stringify(deductError));
        continue;
      }

      // Record transaction linked to entity
      await supabase.from('billing_transactions').insert({
        entity_id: entityId,
        profile_id: account.profile_id,
        amount_cents: -priceCents,
        type: 'postcard_deduction',
        description: `Postcard for donor ${donor.firstname} ${donor.lastname}`
      });

      // 4. Create normalized donor object for this specific contribution
      const normalizedDonor = {
        firstname: donor.firstname || donor.firstName || 'Friend',
        lastname: donor.lastname || donor.lastName || '',
        email: donor.email || '',
        addr1: donor.addr1 || donor.address_line1 || donor.addressLine1 || '',
        addr2: donor.addr2 || donor.address_line2 || donor.addressLine2 || '',
        city: donor.city || '',
        state: donor.state || '',
        zip: donor.zip || donor.postalCode || donor.postal_code || '',
        amount: amount
      };

      // 5. Insert Donation Record
      // We append entityId to actblue_donation_id to ensure uniqueness for split donations
      const donationUid = `${actBlueId}_${entityId}`;
      console.log(`💾 Saving donation record ${donationUid} to database...`);

      const { data: donation, error: donationError } = await supabase
        .from('donations')
        .insert({
          profile_id: account.profile_id,
          actblue_account_id: account.id,
          actblue_donation_id: donationUid,
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
          console.log(`ℹ️ Duplicate donation item received (${donationUid}). Skipping.`);
          // Refund the balance if it's a duplicate and we already deducted it
          await supabase.from('actblue_entities')
            .update({ balance_cents: entity.balance_cents })
            .eq('entity_id', entityId);
          continue;
        }
        console.error("❌ Error inserting donation:", JSON.stringify(donationError));
        continue;
      }

      // 6. Send Postcard via Lob.com API
      // Since actblue_entities is now the source of truth, we pass no overrides
      const lobResult = await sendPostcardViaLob(normalizedDonor, entity, donationDate, isTestMode, {});

      // 7. Create Postcard Record with result
      console.log(`📝 Recording postcard status: ${lobResult.success ? 'processed' : 'failed'}`);
      const postcardStatus = lobResult.success ? 'processed' : 'failed';

      const { data: postcardData, error: postcardError } = await supabase
        .from('postcards')
        .insert({
          donation_id: donation.id,
          profile_id: account.profile_id,
          status: postcardStatus,
          front_image_url: entity.front_image_url,
          back_message: entity.back_message,
          lob_postcard_id: lobResult.lobId || null,
          lob_url: lobResult.url || null,
          error_message: lobResult.error || null
        })
        .select()
        .single();

      if (postcardError) {
        console.error("❌ Error creating postcard record:", JSON.stringify(postcardError));
      } else if (postcardData) {
        // Record initial event
        await supabase.from('postcard_events').insert({
          postcard_id: postcardData.id,
          status: postcardStatus,
          details: lobResult.success ? 'Postcard successfully sent to Lob.com' : `Failed to send to Lob.com: ${lobResult.error}`
        });
      }
    }

    // 4. Update Event Status
    if (eventId) {
      await supabase
        .from('webhook_events')
        .update({ status: 'processed' })
        .eq('id', eventId);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Critical Webhook Error:", error.message);

    // Update Event Status to Error
    if (eventId) {
      await supabase
        .from('webhook_events')
        .update({
          status: 'error',
          error_message: error.message
        })
        .eq('id', eventId);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});