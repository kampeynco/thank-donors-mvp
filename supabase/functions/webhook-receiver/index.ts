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

// Pricing configuration - moved to constants for easier maintenance
const PRICING = {
  pro: 99,
  free: 149
} as const;

const BRANDING_NOTE = "Mailed by Thank Donors";

// Helper function to escape HTML to prevent injection
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper function to substitute variables in message template
function substituteVariables(template: string, donor: any, donationDate: string): string {
  return template
    .replace(/%FIRST_NAME%/g, donor.firstname || 'Friend')
    .replace(/%LAST_NAME%/g, donor.lastname || '')
    .replace(/%FULL_NAME%/g, `${donor.firstname || 'Friend'} ${donor.lastname || ''} `)
    .replace(/%AMOUNT%/g, donor.amount ? `$${donor.amount.toFixed(2)} ` : '')
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
function generatePostcardBackHtml(message: string, showBranding: boolean = true): string {
  // Escape the message to prevent HTML injection
  const escapedMessage = escapeHtml(message);

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
    .content-area {
  position: absolute;
  top: 0.4in;
  left: 0.4in;
  width: 2.7in;
  height: 3.2in;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  box-sizing: border-box;
}
    .message-text {
  width: 95%;
  max-width: 95%;
  font-size: 11pt;
  line-height: 1.5;
  color: #1c1917;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  margin: 0;
}
    .branding-note {
  position: absolute;
  bottom: 0.4in;
  left: 0.4in;
  font-size: 8pt;
  color: #71717a;
  opacity: 0.8;
}
</style>
  </head>
  <body>
  <div class="back-container">
    <div class="content-area">
      <p class="message-text">${escapedMessage}</p>
    </div>
    ${showBranding ? `
    <div class="branding-note">
      ${BRANDING_NOTE}
    </div>
    ` : ''
    }
  </div>
  </body>
  </html>
  `.trim();
}

// Helper function to generate HTML for the postcard front with disclaimer overlay
function generatePostcardFrontHtml(imageUrl: string, disclaimer: string | null, showBranding: boolean): string {
  // Escape disclaimer text to prevent injection
  const escapedDisclaimer = disclaimer ? escapeHtml(disclaimer) : null;

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
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
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
      bottom: 0.1in;
      left: 0;
      right: 0;
      background-color: transparent;
      color: white;
      padding: 0 0.4in;
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 8.5pt;
      line-height: 1.3;
      text-align: center;
      letter-spacing: 0.01em;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    }
  </style>
</head>
<body>
  <div class="front-container">
    ${escapedDisclaimer ? `<div class="disclaimer-overlay">${escapedDisclaimer}</div>` : ''}
  </div>
</body>
</html>
`.trim();
}

// Helper function to validate donor address
function validateAddress(donor: any): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!donor.addr1) missing.push('address_line1');
  if (!donor.city) missing.push('city');
  if (!donor.state) missing.push('state');
  if (!donor.zip) missing.push('zip');

  return {
    valid: missing.length === 0,
    missing
  };
}

// Helper function to send postcard via Lob.com API
async function sendPostcardViaLob(
  normalizedDonor: any,
  entity: any,
  donationDate: string,
  isTestMode: boolean,
  overrides: { front_image_url?: string; back_message?: string; disclaimer?: string } = {}
): Promise<{ success: boolean; lobId?: string; url?: string; lobStatus?: string; error?: string }> {
  const LOB_API_KEY = isTestMode
    ? Deno.env.get("LOB_TEST_API_KEY")
    : Deno.env.get("LOB_LIVE_API_KEY");

  if (!LOB_API_KEY) {
    console.error("❌ Lob API key not found in environment variables");
    return { success: false, error: "Lob API key not configured" };
  }

  console.log(`📡 Preparing Lob request for ${normalizedDonor.firstname} ${normalizedDonor.lastname} (Mode: ${isTestMode ? 'TEST' : 'LIVE'})`);

  // Validate address before proceeding
  const addressValidation = validateAddress(normalizedDonor);
  if (!addressValidation.valid) {
    console.error(`❌ Incomplete address.Missing: ${addressValidation.missing.join(', ')} `);
    return {
      success: false,
      error: `Incomplete address.Missing: ${addressValidation.missing.join(', ')} `
    };
  }

  // Prepare the back message with variable substitution
  const rawBackMessage = overrides.back_message || entity.back_message;
  const backMessage = rawBackMessage
    ? substituteVariables(rawBackMessage, normalizedDonor, donationDate)
    : `Dear ${normalizedDonor.firstname}, \n\nThank you for your generous support!`;

  // Determine branding visibility
  const showBranding = entity.tier === 'free' || (entity.tier === 'pro' && entity.branding_enabled !== false);

  // Prepare Lob API payload
  const lobPayload = {
    description: `Thank you postcard for ${normalizedDonor.firstname} ${normalizedDonor.lastname} `,
    to: {
      name: `${normalizedDonor.firstname} ${normalizedDonor.lastname} `.trim() || "Donor",
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
      overrides.disclaimer || entity.disclaimer,
      showBranding
    ),
    back: generatePostcardBackHtml(backMessage, showBranding),
    size: "4x6",
    mail_type: "usps_first_class",
  };

  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 1000;

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      console.log(`🚀 Lob API Call(Attempt ${attempt})...`);
      const response = await fetch("https://api.lob.com/v1/postcards", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(LOB_API_KEY + ":")} `,
          "Content-Type": "application/json",
          "Lob-Version": "2020-02-11",
        },
        body: JSON.stringify(lobPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        // If it's a client error (4xx) that IS NOT 429 (Too Many Requests) or 408 (Timeout), fail immediately
        if (response.status >= 400 && response.status < 500 && response.status !== 429 && response.status !== 408) {
          console.error(`❌ Lob API Client Error(${response.status}): `, JSON.stringify(result));
          return {
            success: false,
            error: result.error?.message || `Lob API returned ${response.status} `
          };
        }

        // If we have retries left, throw to catch block to handle delay & retry
        if (attempt <= MAX_RETRIES) {
          throw new Error(`Lob API Error ${response.status}: ${result.error?.message || 'Unknown error'} `);
        } else {
          console.error("❌ Lob API Error (Final Attempt):", JSON.stringify(result));
          return {
            success: false,
            error: result.error?.message || `Lob API returned ${response.status} after ${attempt} attempts`
          };
        }
      }

      console.log(`✅ Postcard created successfully! Lob ID: ${result.id} `);
      return {
        success: true,
        lobId: result.id,
        url: result.url,
        lobStatus: result.status
      };

    } catch (error: any) {
      console.warn(`⚠️ Attempt ${attempt} failed: ${error.message} `);

      if (attempt <= MAX_RETRIES) {
        // Exponential backoff: 1s, 2s, 4s
        const backoff = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${backoff}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
      } else {
        return { success: false, error: `Failed after ${MAX_RETRIES} retries: ${error.message} ` };
      }
    }
  }

  return { success: false, error: "Unexpected loop termination" };
}

// Helper function to process a single line item
async function processLineItem(
  item: any,
  donor: any,
  actBlueId: string,
  donationDate: string,
  isTestMode: boolean,
  supabase: any
): Promise<{ success: boolean; error?: string }> {
  const entityId = item.entityId || item.entity_id;
  const amount = parseFloat(item.amount || "0");
  console.log(`🔍 Checking line item.Entity ID: ${entityId}, Amount: ${amount} `);

  // 1. Fetch the Entity and its linked Account in a single query
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
  actblue_accounts(
    id,
    profile_id
  )
    `)
    .eq("entity_id", entityId)
    .single();

  if (entityError || !entity) {
    console.warn(`⚠️ Entity ID ${entityId} not found or query error: ${entityError?.message}.Skipping.`);
    return { success: false, error: `Entity not found: ${entityId} ` };
  }

  const account = entity.actblue_accounts?.[0];
  if (!account) {
    console.warn(`⚠️ No linked profile found for Entity ID ${entityId}.Skipping.`);
    return { success: false, error: 'No linked profile' };
  }

  console.log(`✅ Resolved entity: ${entity.committee_name} and profile: ${account.profile_id} `);

  // 2. Determine pricing
  const priceCents = PRICING[entity.tier as keyof typeof PRICING] || PRICING.free;

  // 3. Atomic balance deduction with constraint to prevent race conditions
  const { data: updatedEntity, error: deductError } = await supabase
    .from('actblue_entities')
    .update({ balance_cents: entity.balance_cents - priceCents })
    .eq('entity_id', entityId)
    .gte('balance_cents', priceCents)
    .select('balance_cents')
    .single();

  if (deductError || !updatedEntity) {
    console.warn(`❌ Entity ${entityId} has insufficient balance or concurrent update.Current: ${entity.balance_cents} c, Need: ${priceCents} c.`);
    return { success: false, error: 'Insufficient balance' };
  }

  console.log(`💰 Deducted ${priceCents}c from entity ${entityId}. New balance: ${updatedEntity.balance_cents} c`);

  // 4. Record transaction linked to entity
  await supabase.from('billing_transactions').insert({
    entity_id: entityId,
    profile_id: account.profile_id,
    amount_cents: -priceCents,
    type: 'postcard_deduction',
    description: `Postcard for donor ${donor.firstname} ${donor.lastname} `
  });

  // 5. Create normalized donor object for this specific contribution
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

  // 6. Insert Donation Record
  const donationUid = `${actBlueId}_${entityId} `;
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
      console.log(`ℹ️ Duplicate donation item received(${donationUid}).Refunding balance.`);

      // Refund the balance using atomic increment
      await supabase.rpc('increment_entity_balance', {
        p_entity_id: entityId,
        p_amount: priceCents
      });

      return { success: false, error: 'Duplicate donation' };
    }

    console.error("❌ Error inserting donation:", JSON.stringify(donationError));

    // Refund balance on error
    await supabase.rpc('increment_entity_balance', {
      p_entity_id: entityId,
      p_amount: priceCents
    });

    return { success: false, error: donationError.message };
  }

  // 7. Send Postcard via Lob.com API
  const lobResult = await sendPostcardViaLob(normalizedDonor, entity, donationDate, isTestMode, {});

  // 8. If Lob failed, refund the balance
  if (!lobResult.success) {
    console.warn(`⚠️ Lob API failed.Refunding ${priceCents}c to entity ${entityId} `);
    await supabase.rpc('increment_entity_balance', {
      p_entity_id: entityId,
      p_amount: priceCents
    });
  }

  // 9. Create Postcard Record with result
  console.log(`📝 Recording postcard status: ${lobResult.success ? 'processed' : 'failed'} `);
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
      details: lobResult.success
        ? 'Postcard successfully sent to Lob.com'
        : `Failed to send to Lob.com: ${lobResult.error} `
    });
  }

  return { success: lobResult.success };
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let eventId: string | undefined;
  let supabase: any;
  let shouldRetry = false;

  try {
    // 1. Setup Supabase Client
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
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

    // Validate payload structure
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
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const actBlueId = orderNumber;

    // Format the date nicely for the postcard
    let donationDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (createdAt) {
      const dateObj = new Date(createdAt);
      if (!isNaN(dateObj.getTime())) {
        donationDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }
    }

    // Determine if we should use test mode
    const isTestMode = !!Deno.env.get("LOB_TEST_API_KEY");

    // 3. Process Line Items in Batches to prevent overwhelming the system
    const BATCH_SIZE = 5;
    const results: { success: boolean; error?: string }[] = [];

    for (let i = 0; i < lineItems.length; i += BATCH_SIZE) {
      const batch = lineItems.slice(i, i + BATCH_SIZE);
      console.log(`📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(lineItems.length / BATCH_SIZE)} `);

      const batchResults = await Promise.all(
        batch.map(item => processLineItem(item, donor, actBlueId, donationDate, isTestMode, supabase))
      );

      results.push(...batchResults);
    }

    // 4. Update Event Status
    if (eventId) {
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      await supabase
        .from('webhook_events')
        .update({
          status: 'processed',
          error_message: failureCount > 0 ? `${failureCount} of ${results.length} line items failed` : null
        })
        .eq('id', eventId);
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    return new Response(JSON.stringify({
      success: true,
      processed: successCount,
      total: totalCount,
      failures: totalCount - successCount
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("❌ Critical Webhook Error:", error.message);

    // Determine if this is a retryable error (server errors or network issues)
    const isServerError = error.message?.includes('500') ||
      error.message?.includes('503') ||
      error.message?.includes('timeout') ||
      error.message?.includes('network');

    shouldRetry = isServerError;

    // Update Event Status to Error
    if (eventId && supabase) {
      await supabase
        .from('webhook_events')
        .update({
          status: 'error',
          error_message: error.message
        })
        .eq('id', eventId);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: shouldRetry ? 500 : 400, // 500 triggers retry, 400 does not
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});