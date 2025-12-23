
// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type ConnectHookdeckRequest = {
  entityId: number;
  committeeName: string;
  platform?: string | null; // default: "actblue"
  street_address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  disclaimer?: string | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sanitizeSourceName(committeeName: string, entityId: number) {
  const cleaned = (committeeName ?? "")
    .replace(/[^A-Za-z0-9-_]/g, "")
    .slice(0, 60);
  const base = cleaned.length ? cleaned : "Committee";
  return `${base}_${entityId}`;
}

function generatePassword(length = 12) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*-_+=";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

async function hookdeckRequest<T>(
  method: string,
  path: string,
  apiKey: string,
  body?: unknown,
): Promise<{ status: number; data?: T; text?: string }> {
  const res = await fetch(`https://api.hookdeck.com/2025-07-01${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  try {
    return { status: res.status, data: text ? (JSON.parse(text) as T) : undefined, text };
  } catch {
    return { status: res.status, text };
  }
}

// @ts-ignore
Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Return 405 for non-POST requests (like GET from Slack bot)
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed. Use POST." }, 405);
  }

  try {
    // 1) Env Var Setup
    // @ts-ignore
    const SBASE_URL = Deno.env.get("SBASE_URL") ?? Deno.env.get("SBASE_URL");
    // @ts-ignore
    const SBASE_ANON_KEY =
      Deno.env.get("SBASE_ANON_KEY") ?? Deno.env.get("SBASE_ANON_KEY");
    // @ts-ignore
    const HOOKDECK_API_KEY = Deno.env.get("HOOKDECK_API_KEY");
    // @ts-ignore
    let hookdeckDestinationId = Deno.env.get("HOOKDECK_DESTINATION_ID");

    if (!SBASE_URL || !SBASE_ANON_KEY) {
      return jsonResponse(
        { error: "Missing env vars: SBASE_URL/SBASE_URL or SBASE_ANON_KEY/SBASE_ANON_KEY" },
        500,
      );
    }
    if (!HOOKDECK_API_KEY) {
      return jsonResponse({ error: "Missing env var: HOOKDECK_API_KEY" }, 500);
    }

    // Validate API key format
    if (!HOOKDECK_API_KEY.trim() || HOOKDECK_API_KEY.length < 20) {
      console.error("❌ Invalid HOOKDECK_API_KEY format");
      return jsonResponse({
        error: "HOOKDECK_API_KEY appears to be invalid (too short or empty)",
        hint: "Check your Supabase secrets configuration"
      }, 500);
    }

    console.log("✅ HOOKDECK_API_KEY present (length:", HOOKDECK_API_KEY.length, ")");

    // 2) Auth Check
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    const supabase = createClient(SBASE_URL, SBASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const user = userData?.user;
    if (userErr || !user) {
      return jsonResponse({ error: "Unauthorized", details: userErr }, 401);
    }

    // 3) Parse Body - FIXED to handle both wrapped and unwrapped formats
    const raw = await request.text();
    console.log("📦 Raw request body:", raw);
    console.log("📦 Content-Type:", request.headers.get("content-type"));

    let payload: ConnectHookdeckRequest | null = null;

    try {
      if (!raw || raw.trim() === "") {
        console.error("❌ Empty request body");
        return jsonResponse({
          error: "Request body is required",
          hint: "Send JSON with entityId and committeeName"
        }, 400);
      }

      const parsed = JSON.parse(raw);
      console.log("✅ Parsed JSON:", JSON.stringify(parsed, null, 2));

      // Handle both formats:
      // 1. Direct: { entityId: 123, committeeName: "..." }
      // 2. Wrapped: { body: { entityId: 123, committeeName: "..." } }
      if (parsed.body && typeof parsed.body === 'object') {
        console.log("📦 Detected wrapped body format");
        payload = parsed.body as ConnectHookdeckRequest;
      } else {
        console.log("📦 Detected direct body format");
        payload = parsed as ConnectHookdeckRequest;
      }

      console.log("✅ Final payload:", JSON.stringify(payload, null, 2));
    } catch (e) {
      console.error("❌ JSON parse error:", e);
      return jsonResponse(
        {
          error: "Invalid JSON body",
          details: String(e),
          receivedBody: raw.substring(0, 500)
        },
        400,
      );
    }

    if (!payload || typeof payload !== 'object') {
      console.error("❌ Payload is not a valid object");
      return jsonResponse({
        error: "Request body must be a JSON object",
        receivedType: typeof payload
      }, 400);
    }

    // Extract and validate fields - support both camelCase and snake_case
    const entityIdRaw = (payload as any).entityId ?? (payload as any).entity_id;
    const committeeNameRaw = (payload as any).committeeName ?? (payload as any).committee_name;
    const platformRaw = (payload as any).platform;
    const streetAddressRaw = (payload as any).streetAddress ?? (payload as any).street_address;
    const cityRaw = (payload as any).city;
    const stateRaw = (payload as any).state;
    const postalCodeRaw = (payload as any).postalCode ?? (payload as any).postal_code;
    const disclaimerRaw = (payload as any).disclaimer;

    console.log("🔍 Extracted fields:", {
      entityIdRaw,
      committeeNameRaw,
      platformRaw,
      disclaimerRaw,
      streetAddressRaw,
      cityRaw,
      stateRaw,
      postalCodeRaw,
      types: {
        entityId: typeof entityIdRaw,
        committeeName: typeof committeeNameRaw,
        platform: typeof platformRaw,
      }
    });

    // Convert with validation
    const entityId = Number(entityIdRaw);
    const committeeName = String(committeeNameRaw ?? "").trim();
    const platform = String(platformRaw ?? "actblue").trim() || "actblue";
    const streetAddress = streetAddressRaw ? String(streetAddressRaw).trim() : null;
    const city = cityRaw ? String(cityRaw).trim() : null;
    const state = stateRaw ? String(stateRaw).trim() : null;
    const postalCode = postalCodeRaw ? String(postalCodeRaw).trim() : null;
    const disclaimer = disclaimerRaw ? String(disclaimerRaw).trim() : null;

    console.log("🔄 Converted values:", {
      entityId,
      committeeName,
      platform,
      streetAddress,
      city,
      state,
      postalCode,
      disclaimer,
      entityIdIsFinite: Number.isFinite(entityId),
      committeeNameLength: committeeName.length,
    });

    // Validation
    if (!Number.isFinite(entityId) || entityId <= 0) {
      console.error("❌ entityId validation failed");
      return jsonResponse({
        error: "entityId is required and must be a positive number",
        received: {
          value: entityIdRaw,
          type: typeof entityIdRaw,
        },
        example: { entityId: 12345, committeeName: "My Committee" }
      }, 400);
    }

    if (!committeeName || committeeName.length === 0) {
      console.error("❌ committeeName validation failed");
      return jsonResponse({
        error: "committeeName is required and cannot be empty",
        received: {
          value: committeeNameRaw,
          type: typeof committeeNameRaw,
        },
        example: { entityId: 12345, committeeName: "My Committee" }
      }, 400);
    }

    console.log("✅ Validation passed");

    // 4) Idempotency Check - more comprehensive
    const { data: existing, error: existingError } = await supabase
      .from("actblue_accounts")
      .select("*")
      .eq("profile_id", user.id)
      .eq("entity_id", entityId)
      .maybeSingle();

    if (existingError) {
      console.error("Error checking existing account:", existingError);
    }

    if (existing) {
      console.log("✅ Found existing account, returning early");
      return jsonResponse({
        success: true,
        ok: true,
        existing: true,
        account: existing
      });
    }

    console.log("🔧 No existing account found, creating new resources...");

    // 5) Ensure Destination Exists
    if (!hookdeckDestinationId) {
      const webhookReceiverUrl = `${SBASE_URL}/functions/v1/webhook-receiver`;
      const destName = "ThankDonors Receiver";

      const listDest = await hookdeckRequest<{ models: any[] }>(
        "GET",
        `/destinations?name=${encodeURIComponent(destName)}`,
        HOOKDECK_API_KEY,
      );

      if (listDest.data?.models && listDest.data.models.length > 0) {
        hookdeckDestinationId = listDest.data.models[0].id;
        // Force update the URL to ensure it points to the correct webhook-receiver
        console.log("🔄 Updating existing destination URL...");
        await hookdeckRequest(
          "PUT",
          `/destinations/${hookdeckDestinationId}`,
          HOOKDECK_API_KEY,
          { url: webhookReceiverUrl }
        );
      } else {
        const createDest = await hookdeckRequest<{ id: string }>(
          "POST",
          "/destinations",
          HOOKDECK_API_KEY,
          {
            name: destName,
            url: webhookReceiverUrl,
            rate_limit_period: "second",
            rate_limit: 10,
          },
        );

        if (createDest.status >= 400 || !createDest.data?.id) {
          return jsonResponse(
            {
              error: "Failed to auto-create Hookdeck destination",
              details: createDest.text,
            },
            500,
          );
        }
        hookdeckDestinationId = createDest.data.id;
      }
    }

    if (!hookdeckDestinationId) {
      return jsonResponse({ error: "Could not resolve Hookdeck Destination ID" }, 500);
    }

    // 6) Create Hookdeck Source with Basic Auth
    const password = generatePassword(12); // 12 characters with symbols
    const sourceName = sanitizeSourceName(committeeName, entityId);
    console.log("🔧 Creating Hookdeck source:", sourceName);

    type HookdeckSource = { id: string; name: string; url: string; config?: any };
    let source: HookdeckSource | null = null;

    // Create source with Basic Auth config inline
    const createSource = await hookdeckRequest<HookdeckSource>(
      "POST",
      "/sources",
      HOOKDECK_API_KEY,
      {
        name: sourceName,
        config: {
          auth_type: "BASIC_AUTH",
          auth: {
            username: sourceName,
            password: password,
          }
        }
      },
    );

    console.log("📡 Create Source response:", {
      status: createSource.status,
      hasData: !!createSource.data,
      dataId: createSource.data?.id,
      text: createSource.text?.substring(0, 200),
    });

    if ((createSource.status === 200 || createSource.status === 201) && createSource.data?.id) {
      source = createSource.data;
      console.log("✅ Source created with Basic Auth:", source.id);
    } else if (createSource.status === 409) {
      console.log("⚠️ Source exists, fetching and updating auth...");
      const list = await hookdeckRequest<{ models: HookdeckSource[] }>(
        "GET",
        `/sources?name=${encodeURIComponent(sourceName)}`,
        HOOKDECK_API_KEY,
      );
      source = list.data?.models?.[0] ?? null;

      if (source?.id) {
        // Update existing source with new Basic Auth credentials
        const updateAuth = await hookdeckRequest<HookdeckSource>(
          "PUT",
          `/sources/${encodeURIComponent(source.id)}`,
          HOOKDECK_API_KEY,
          {
            name: sourceName,
            config: {
              auth_type: "BASIC_AUTH",
              auth: {
                username: sourceName,
                password: password,
              }
            }
          },
        );

        if (updateAuth.status === 200 && updateAuth.data?.id) {
          source = updateAuth.data;
          console.log("✅ Existing source auth updated:", source.id);
        }
      }

      console.log("📡 Found existing source:", source?.id);
    } else {
      console.error("❌ Failed to create source:", {
        status: createSource.status,
        text: createSource.text,
      });
      return jsonResponse(
        { error: "Failed to create Source", status: createSource.status, details: createSource.text },
        500,
      );
    }

    if (!source?.id) {
      return jsonResponse({ error: "Source creation failed (no ID returned)" }, 500);
    }

    // Source is now created with Basic Auth configured
    console.log("✅ Source ready with Basic Auth");

    // 8) Create Connection
    type HookdeckConnection = { id: string; name: string };
    const connectionName = platform; // Just use the platform name (e.g., "actblue")
    let connection: HookdeckConnection | null = null;
    console.log("🔧 Creating connection:", connectionName);

    const createConn = await hookdeckRequest<HookdeckConnection>(
      "POST",
      "/connections",
      HOOKDECK_API_KEY,
      {
        name: connectionName,
        source_id: source.id,
        destination_id: hookdeckDestinationId,
      },
    );

    console.log("📡 Create Connection response:", {
      status: createConn.status,
      hasData: !!createConn.data,
      text: createConn.text?.substring(0, 200),
    });

    if ((createConn.status === 200 || createConn.status === 201) && createConn.data?.id) {
      connection = createConn.data;
      console.log("✅ Connection created:", connection.id);
    } else if (createConn.status === 409) {
      console.log("⚠️ Connection exists, fetching...");
      const list = await hookdeckRequest<{ models: HookdeckConnection[] }>(
        "GET",
        `/connections?name=${encodeURIComponent(connectionName)}`,
        HOOKDECK_API_KEY,
      );
      connection = list.data?.models?.[0] ?? null;
      console.log("📡 Found existing connection:", connection?.id);
    } else {
      console.error("❌ Failed to create connection");
      return jsonResponse(
        { error: "Failed to create Connection", status: createConn.status, details: createConn.text },
        500,
      );
    }

    if (!connection?.id) {
      return jsonResponse({ error: "Connection creation failed" }, 500);
    }

    // 9) Database Upsert for Entity and Insert for Account
    const entityPayload = {
      entity_id: entityId,
      committee_name: committeeName,
      street_address: streetAddress,
      city: city,
      state: state,
      postal_code: postalCode,
      disclaimer: disclaimer,
      webhook_url: source.url,
      webhook_username: sourceName,
      webhook_password: password,
      webhook_source_id: source.id,
      webhook_connection_id: connection.id,
      updated_at: new Date().toISOString()
    };

    console.log("📝 Entity upsert payload:", entityPayload);

    const { error: entityErr } = await supabase
      .from("actblue_entities")
      .upsert(entityPayload, { onConflict: 'entity_id' });

    if (entityErr) {
      console.error("Entity Upsert Error:", entityErr);
      return jsonResponse({ error: `Entity Update Failed: ${entityErr.message}` }, 500);
    }

    const accountPayload = {
      profile_id: user.id,
      entity_id: entityId,
      platform
    };

    console.log("📝 Account insert payload:", accountPayload);

    const { data: inserted, error: insertErr } = await supabase
      .from("actblue_accounts")
      .insert(accountPayload)
      .select("*, entity:actblue_entities(*)")
      .single();

    if (insertErr) {
      console.error("DB Insert Error:", insertErr);

      // rollback hookdeck resources
      try {
        if (connection?.id) {
          await hookdeckRequest("DELETE", `/connections/${connection.id}`, HOOKDECK_API_KEY);
        }
        if (source?.id) {
          await hookdeckRequest("DELETE", `/sources/${source.id}`, HOOKDECK_API_KEY);
        }
      } catch (rollbackErr) {
        console.error("Rollback failed:", rollbackErr);
      }

      let msg = `Database Insert Failed: ${insertErr.message}`;
      if (insertErr.message?.includes('column "platform"')) {
        msg +=
          ". Please run: ALTER TABLE actblue_accounts ADD COLUMN platform TEXT DEFAULT 'actblue';";
      }
      return jsonResponse({ error: msg, details: insertErr }, 500);
    }

    console.log("✅ Success!");

    // Ensure all required fields are present in the response
    const response = {
      success: true,
      ok: true,
      existing: false,
      account: {
        ...(inserted as any),
        ...(inserted as any).entity // Flatten for response
      },
      hookdeck: {
        source_id: source.id,
        source_url: source.url,
        connection_id: connection.id,
        destination_id: hookdeckDestinationId,
      },
    };

    console.log("📤 Returning response:", JSON.stringify(response, null, 2));
    return jsonResponse(response);
  } catch (err: any) {
    console.error("❌ Function Error:", err);
    return jsonResponse(
      {
        error: err?.message || "Internal Server Error",
        stack: err?.stack,
      },
      500,
    );
  }
});