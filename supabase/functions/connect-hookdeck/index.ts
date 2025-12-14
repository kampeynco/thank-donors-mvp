
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { committee_name, entity_id } = await req.json();

    if (!entity_id) {
        throw new Error("Entity ID is required for webhook setup.");
    }

    // Configuration
    // @ts-ignore
    const HOOKDECK_API_KEY = Deno.env.get("HOOKDECK_API_KEY");
    // @ts-ignore
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    // @ts-ignore
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!HOOKDECK_API_KEY) {
      throw new Error("HOOKDECK_API_KEY is not set in Edge Function secrets.");
    }

    // 1. Generate Credentials & Naming
    // Name: {CommitteeName}_{EntityID} (Sanitized)
    const sanitizedCommittee = (committee_name || "campaign").replace(/[^A-Za-z0-9-_]/g, '');
    const sourceName = `${sanitizedCommittee}_${entity_id}`;
    const password = crypto.randomUUID().substring(0, 8); // 8 chars

    // Helper for Hookdeck API calls
    // Using 2023-07-01 stable version
    const hookdeckFetch = async (endpoint: string, method: string, body?: any) => {
      const response = await fetch(`https://api.hookdeck.com/2023-07-01${endpoint}`, {
        method,
        headers: {
          "Authorization": `Bearer ${HOOKDECK_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        // Handle conflict specially if possible, otherwise throw text
        const text = await response.text();
        if (response.status === 409 || response.status === 422) {
             throw new Error(`HOOKDECK_CONFLICT:${text}`);
        }
        throw new Error(`Hookdeck API failed [${response.status}]: ${text}`);
      }
      return response.json();
    };

    // 2. Destination (Shared)
    // We want a single destination for all accounts: "Supabase - Webhook Receiver"
    const destName = "Supabase - Webhook Receiver";
    const destUrl = `${SUPABASE_URL}/functions/v1/webhook-receiver`;
    
    // Check if it exists (List and Find)
    const destsResponse = await hookdeckFetch("/destinations", "GET");
    let destination = destsResponse.models?.find((d: any) => d.name === destName);

    if (!destination) {
        // Create if missing
        destination = await hookdeckFetch("/destinations", "POST", {
            name: destName,
            url: destUrl,
            // Pass Supabase Auth
            auth_method: {
                type: "API_KEY",
                config: {
                    key: "Authorization",
                    value: `Bearer ${SUPABASE_ANON_KEY}`,
                    to: "header"
                }
            }
        });
    }

    // 3. Source (Unique per Account)
    let source;
    const sourceConfig = {
        name: sourceName,
        verification: {
            type: "BASIC_AUTH",
            configs: {
                username: sourceName,
                password: password
            }
        }
    };

    try {
        source = await hookdeckFetch("/sources", "POST", sourceConfig);
    } catch (e: any) {
        if (e.message.startsWith("HOOKDECK_CONFLICT")) {
            // Fetch existing and update credentials
            const sourcesResponse = await hookdeckFetch("/sources", "GET");
            const existingSource = sourcesResponse.models?.find((s: any) => s.name === sourceName);
            
            if (existingSource) {
                // Update credentials to the new ones we generated so we can display them
                source = await hookdeckFetch(`/sources/${existingSource.id}`, "PUT", {
                    verification: sourceConfig.verification
                });
            } else {
                throw new Error("Source name collision but could not find existing source.");
            }
        } else {
            throw e;
        }
    }

    // 4. Connection (Link Source -> Destination)
    // Check for existing connection to avoid duplicates
    const connectionsResponse = await hookdeckFetch(`/connections?source_id=${source.id}`, "GET");
    let connection = connectionsResponse.models?.find((c: any) => c.destination_id === destination.id);

    if (!connection) {
        connection = await hookdeckFetch("/connections", "POST", {
            name: "actblue",
            source_id: source.id,
            destination_id: destination.id
        });
    }

    // 5. Return Details
    return new Response(
      JSON.stringify({
        webhook_url: source.url,
        webhook_source_id: source.id,
        webhook_connection_id: connection.id,
        webhook_username: sourceName,
        webhook_password: password,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("Error in connect-hookdeck:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
