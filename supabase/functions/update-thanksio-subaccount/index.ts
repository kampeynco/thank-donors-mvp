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
Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed. Use POST." }, 405);
  }

  try {
    // @ts-ignore
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    // @ts-ignore
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    // @ts-ignore
    const THANKSIO_API_KEY = Deno.env.get("THANKSIO_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return jsonResponse({ error: "Missing Supabase environment variables" }, 500);
    }

    if (!THANKSIO_API_KEY) {
      return jsonResponse({ error: "Missing THANKSIO_API_KEY" }, 500);
    }

    // Auth Check
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const user = userData?.user;
    if (userErr || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // Parse request body
    const body = await request.json();
    const { 
      account_id, 
      thanksio_subaccount_id, 
      committee_name, 
      street_address, 
      city, 
      state, 
      postal_code 
    } = body;

    if (!thanksio_subaccount_id) {
      return jsonResponse({ error: "thanksio_subaccount_id is required" }, 400);
    }

    // Verify account ownership
    const { data: account, error: fetchErr } = await supabase
      .from("actblue_accounts")
      .select("*")
      .eq("id", account_id)
      .eq("profile_id", user.id)
      .single();

    if (fetchErr || !account) {
      return jsonResponse({ error: "Account not found or access denied" }, 404);
    }

    // Update Thanks.io subaccount
    console.log(`Updating Thanks.io subaccount: ${thanksio_subaccount_id}`);
    
    const thanksioResponse = await fetch(
      `https://api.thanks.io/api/v2/sub-accounts/${thanksio_subaccount_id}`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${THANKSIO_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: committee_name || account.committee_name,
          return_name: committee_name || account.committee_name,
          return_address: street_address || account.street_address || "",
          return_city: city || account.city || "",
          return_state: state || account.state || "",
          return_postal_code: postal_code || account.postal_code || "",
        }),
      }
    );

    if (!thanksioResponse.ok) {
      const errorText = await thanksioResponse.text();
      console.error("Thanks.io update failed:", errorText);
      return jsonResponse({ 
        error: "Failed to update Thanks.io subaccount", 
        details: errorText 
      }, 500);
    }

    const thanksioData = await thanksioResponse.json();
    console.log("✅ Thanks.io subaccount updated:", thanksioData);

    return jsonResponse({ 
      success: true, 
      subaccount: thanksioData 
    });

  } catch (err: any) {
    console.error("Function Error:", err);
    return jsonResponse({ error: err?.message || "Internal Server Error" }, 500);
  }
});
