import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { processLineItem } from "./processor.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let eventId: string | undefined;
  let supabase: any;
  let shouldRetry = false;

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase Service Role configuration.");
    }

    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let payload = await req.json();
    console.log("Received Webhook Payload. Keys:", Object.keys(payload));

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

    if (payload.body && !payload.contribution && !payload.donor) {
      console.log("📦 Detected wrapped body format (Hookdeck)");
      payload = typeof payload.body === 'string' ? JSON.parse(payload.body) : payload.body;
    }

    const contribution = payload.contribution;
    const donor = payload.donor || contribution?.donor;
    const lineItems = payload.lineitems || payload.lineItems || contribution?.lineitems || contribution?.lineItems || [];
    const orderNumber = contribution?.orderNumber || contribution?.order_number || payload.orderNumber;
    const createdAt = contribution?.createdAt || contribution?.created_at || payload.createdAt;

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
    let donationDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (createdAt) {
      const dateObj = new Date(createdAt);
      if (!isNaN(dateObj.getTime())) {
        donationDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }
    }

    const isTestMode = !!Deno.env.get("LOB_TEST_API_KEY");
    const BATCH_SIZE = 5;
    const results: { success: boolean; error?: string }[] = [];

    for (let i = 0; i < lineItems.length; i += BATCH_SIZE) {
      const batch = lineItems.slice(i, i + BATCH_SIZE);
      console.log(`📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(lineItems.length / BATCH_SIZE)}`);

      const batchResults = await Promise.all(
        batch.map(item => processLineItem(item, donor, actBlueId, donationDate, isTestMode, supabase))
      );

      results.push(...batchResults);
    }

    if (eventId) {
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
    const isServerError = error.message?.includes('500') ||
      error.message?.includes('503') ||
      error.message?.includes('timeout') ||
      error.message?.includes('network');
    shouldRetry = isServerError;

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
      status: shouldRetry ? 500 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});