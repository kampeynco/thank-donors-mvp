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

        // 3. Verify Event Type and Map to Enum
        const eventType = payload.event_type_id; // e.g., "postcard.in_transit"
        const resourceId = payload.body?.id;

        if (!eventType || !resourceId) {
            console.error("Missing event_type_id or resource ID in payload", { eventType, resourceId });
            return new Response(JSON.stringify({ error: "Invalid payload structure" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        // Extract the status part (everything after "postcard.")
        const newStatus = eventType.replace('postcard.', '');

        // Valid statuses defined in our postcard_status_type enum
        const validStatuses = [
            'mailed',
            'in_transit',
            'in_local_area',
            'processed_for_delivery',
            'delivered',
            're_routed',
            'returned_to_sender'
        ];

        if (!validStatuses.includes(newStatus)) {
            console.log(`Ignoring event type: ${eventType} (mapped to: ${newStatus})`);
            return new Response(JSON.stringify({ message: "Ignored event type" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

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

        if (data && data.length > 0) {
            const postcard = data[0];
            // Record tracking event
            await supabase.from('postcard_events').insert({
                postcard_id: postcard.id,
                status: newStatus,
                description: `Tracking update: ${newStatus.replace(/_/g, ' ')}`
            });
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