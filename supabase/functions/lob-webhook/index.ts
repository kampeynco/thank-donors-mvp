import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

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
        // 1. Setup Supabase Client
        // @ts-ignore
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        // @ts-ignore
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error("Missing Supabase Service Role configuration.");
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 2. Parse Lob Webhook Payload
        const payload = await req.json();
        console.log("Received Lob Webhook:", payload.event_type_id);

        // 3. Verify Event Type
        const eventType = payload.event_type_id;
        // We care about postcard.in_transit and postcard.delivered
        const relevantEvents = ['postcard.in_transit', 'postcard.delivered'];

        if (!relevantEvents.includes(eventType)) {
            console.log(`Ignoring event type: ${eventType}`);
            return new Response(JSON.stringify({ message: "Ignored event type" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // 4. Extract Postcard ID from Payload
        // Lob events have the resource in payload.body
        const resourceId = payload.body.id;
        if (!resourceId) {
            console.error("No resource ID found in payload");
            return new Response(JSON.stringify({ error: "No resource ID found" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        // 5. Build Status Map
        let newStatus = '';
        if (eventType === 'postcard.in_transit') newStatus = 'IN_TRANSIT';
        else if (eventType === 'postcard.delivered') newStatus = 'DELIVERED';

        console.log(`Updating postcard ${resourceId} to status ${newStatus}`);

        // 6. Update Database
        const { data, error } = await supabase
            .from('postcards')
            .update({ status: newStatus })
            .eq('lob_postcard_id', resourceId)
            .select();

        if (error) {
            console.error("Error updating postcard status:", error);
            throw error;
        }

        if (!data || data.length === 0) {
            console.warn(`No postcard found with Lob ID ${resourceId}`);
            // Return 200 to Lob anyway to acknowledge receipt
            return new Response(JSON.stringify({ message: "Postcard not found in DB" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        console.log("Successfully updated status:", data);

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: any) {
        console.error("Lob webhook processing error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            }
        );
    }
});