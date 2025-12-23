
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { account_id } = await req.json();

    // @ts-ignore
    const HOOKDECK_API_KEY = Deno.env.get("HOOKDECK_API_KEY");
    // @ts-ignore
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    // @ts-ignore
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!HOOKDECK_API_KEY) throw new Error("Missing HOOKDECK_API_KEY");

    // 1. Validate User & Fetch Account Details
    // We need the Authorization header to ensure the user requesting deletion owns the account
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user from JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // Fetch the account to get Hookdeck IDs
    const { data: account, error: fetchError } = await supabaseClient
      .from('actblue_accounts')
      .select('*')
      .eq('id', account_id)
      .eq('profile_id', user.id) // Security check: must belong to user
      .single();

    if (fetchError || !account) {
      return new Response(JSON.stringify({ error: "Account not found or access denied" }), { status: 404, headers: corsHeaders });
    }

    // 2. Helper for Hookdeck API
    const hookdeckFetch = async (endpoint: string, method: string) => {
      const response = await fetch(`https://api.hookdeck.com/2023-07-01${endpoint}`, {
        method,
        headers: { "Authorization": `Bearer ${HOOKDECK_API_KEY}` }
      });
      // We don't throw on 404 (resource already gone)
      if (!response.ok && response.status !== 404) {
        const txt = await response.text();
        console.error(`Hookdeck delete failed [${endpoint}]:`, txt);
      }
    };

    // 3. Delete Hookdeck Resources
    // Delete Connection first to stop routing
    if (account.webhook_connection_id) {
      console.log(`Deleting Connection: ${account.webhook_connection_id}`);
      await hookdeckFetch(`/connections/${account.webhook_connection_id}`, "DELETE");
    }

    // Delete Source next to remove the URL
    if (account.webhook_source_id) {
      console.log(`Deleting Source: ${account.webhook_source_id}`);
      await hookdeckFetch(`/sources/${account.webhook_source_id}`, "DELETE");
    }

    // 4. Delete from Database
    const { error: deleteError } = await supabaseClient
      .from('actblue_accounts')
      .delete()
      .eq('id', account_id);

    if (deleteError) throw deleteError;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("Delete Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});