
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
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return jsonResponse({ error: "Missing Authorization header" }, 401);

        // @ts-ignore
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("SBASE_URL");
        // @ts-ignore
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SBASE_SERVICE_ROLE_KEY");
        // @ts-ignore
        const HOOKDECK_API_KEY = Deno.env.get("HOOKDECK_API_KEY");

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing Supabase configuration");

        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Get user from JWT
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));

        if (authError || !user) return jsonResponse({ error: "Unauthorized" }, 401);

        console.log(`Starting full deletion for user: ${user.id}`);

        // 1. Fetch all ActBlue Accounts for this user
        const { data: accounts, error: accountsError } = await supabaseClient
            .from('actblue_accounts')
            .select('*')
            .eq('profile_id', user.id);

        if (accountsError) {
            console.error("Error fetching accounts:", accountsError);
        }

        // 2. Clean up each account (campaign)
        if (accounts && accounts.length > 0) {
            for (const account of accounts) {
                // Check if last user for this entity
                const { count: userCount, error: countError } = await supabaseClient
                    .from('actblue_accounts')
                    .select('*', { count: 'exact', head: true })
                    .eq('entity_id', account.entity_id);

                if (countError) console.error("Count error:", countError);

                if (userCount === 1) {
                    // Last user! Clean up entity resources
                    console.log(`Cleaning up entity ${account.entity_id} (Last user deletion)`);

                    // Delete Hookdeck
                    if (HOOKDECK_API_KEY) {
                        if (account.webhook_connection_id) {
                            await fetch(`https://api.hookdeck.com/2025-07-01/connections/${account.webhook_connection_id}`, {
                                method: 'DELETE',
                                headers: { "Authorization": `Bearer ${HOOKDECK_API_KEY}` }
                            });
                        }
                        if (account.webhook_source_id) {
                            await fetch(`https://api.hookdeck.com/2025-07-01/sources/${account.webhook_source_id}`, {
                                method: 'DELETE',
                                headers: { "Authorization": `Bearer ${HOOKDECK_API_KEY}` }
                            });
                        }
                    }

                    // Delete Storage for entity
                    const folder = `entity_${account.entity_id}`;
                    const { data: files } = await supabaseClient.storage.from('images').list(folder);
                    if (files && files.length > 0) {
                        const filePaths = files.map(f => `${folder}/${f.name}`);
                        console.log(`Deleting entity files: ${filePaths.length}`);
                        await supabaseClient.storage.from('images').remove(filePaths);
                    }

                    // Delete Entity (Cascades to account link and other related data)
                    await supabaseClient.from('actblue_entities').delete().eq('entity_id', account.entity_id);
                } else {
                    // Shared campaign: just delete this user's account link
                    console.log(`Deleting account link for entity ${account.entity_id} (shared campaign)`);
                    await supabaseClient.from('actblue_accounts').delete().eq('id', account.id);
                }
            }
        }

        // 3. Clean up user's personal storage (legacy or non-entity uploads)
        console.log(`Cleaning up personal storage for user: ${user.id}`);
        const { data: userFiles } = await supabaseClient.storage.from('images').list(user.id);
        if (userFiles && userFiles.length > 0) {
            const userFilePaths = userFiles.map(f => `${user.id}/${f.name}`);
            console.log(`Deleting user files: ${userFilePaths.length}`);
            await supabaseClient.storage.from('images').remove(userFilePaths);
        }

        // 4. Delete Profile
        console.log(`Deleting profile record...`);
        await supabaseClient.from('profiles').delete().eq('id', user.id);

        // 5. Delete Authentication User
        console.log(`Deleting auth user...`);
        await supabaseClient.auth.admin.deleteUser(user.id);

        console.log(`✅ User ${user.id} fully deleted.`);
        return jsonResponse({ success: true });

    } catch (error: any) {
        console.error("Delete User Error:", error);
        return jsonResponse({ error: error.message }, 500);
    }
});
