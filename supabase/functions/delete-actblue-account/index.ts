
// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// @ts-ignore
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { account_id } = await req.json();

    if (!account_id) {
      return jsonResponse({ error: "account_id is required" }, 400);
    }

    // @ts-ignore
    const HOOKDECK_API_KEY = Deno.env.get("HOOKDECK_API_KEY");
    // @ts-ignore
    const THANKSIO_API_KEY = Deno.env.get("THANKSIO_API_KEY");
    // @ts-ignore
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("SBASE_URL");
    // @ts-ignore
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SBASE_SERVICE_ROLE_KEY");

    if (!HOOKDECK_API_KEY) throw new Error("Missing HOOKDECK_API_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing Supabase configuration");

    // 1. Validate User & Fetch Account Details
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user from JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // Fetch the account to get Hookdeck IDs and Thanks.io ID
    const { data: account, error: fetchError } = await supabaseClient
      .from('actblue_accounts')
      .select('*')
      .eq('id', account_id)
      .eq('profile_id', user.id) // Security check: must belong to user
      .single();

    if (fetchError || !account) {
      console.error("Account fetch error or not found:", fetchError);
      return jsonResponse({ error: "Account not found or access denied" }, 404);
    }

    // 2. Helper for Hookdeck API
    const hookdeckFetch = async (endpoint: string, method: string) => {
      console.log(`Hookdeck ${method} ${endpoint}`);
      const response = await fetch(`https://api.hookdeck.com/2025-07-01${endpoint}`, {
        method,
        headers: { "Authorization": `Bearer ${HOOKDECK_API_KEY}` }
      });
      // We don't throw on 404 (resource already gone)
      if (!response.ok && response.status !== 404) {
        const txt = await response.text();
        console.error(`❌ Hookdeck delete failed [${endpoint}]:`, txt);
      } else if (response.ok) {
        console.log(`✅ Hookdeck resource deleted: ${endpoint}`);
      }
    };

    // 3. Delete Hookdeck Resources
    // Delete Connection first
    if (account.webhook_connection_id) {
      await hookdeckFetch(`/connections/${account.webhook_connection_id}`, "DELETE");
    }

    // Delete Source next
    if (account.webhook_source_id) {
      await hookdeckFetch(`/sources/${account.webhook_source_id}`, "DELETE");
    }

    // 4. Delete Thanks.io Subaccount
    if (account.thanksio_subaccount_id && THANKSIO_API_KEY) {
      console.log(`Deleting Thanks.io subaccount: ${account.thanksio_subaccount_id}`);
      try {
        const thanksResponse = await fetch(`https://api.thanks.io/api/v2/sub-accounts/${account.thanksio_subaccount_id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${THANKSIO_API_KEY}` }
        });
        if (!thanksResponse.ok && thanksResponse.status !== 404) {
          console.error(`❌ Thanks.io delete failed:`, await thanksResponse.text());
        } else {
          console.log(`✅ Thanks.io subaccount deleted`);
        }
      } catch (e) {
        console.error("❌ Thanks.io API error:", e);
      }
    }

    // 5. Delete from Database
    const { error: deleteError } = await supabaseClient
      .from('actblue_accounts')
      .delete()
      .eq('id', account_id);

    if (deleteError) throw deleteError;

    return jsonResponse({ success: true });

  } catch (error: any) {
    console.error("Delete Error:", error);
    return jsonResponse({ error: error.message }, 500);
  }
});