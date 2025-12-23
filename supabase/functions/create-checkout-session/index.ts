
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

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 1. Get Auth Context
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response("Missing Authorization header", { status: 401 });
        }

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") || "",
            Deno.env.get("SUPABASE_ANON_KEY") || ""
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser(
            authHeader.replace("Bearer ", "")
        );

        if (authError || !user) {
            return new Response("Invalid token", { status: 401 });
        }

        // 2. Parse Body
        const { type, success_url, cancel_url } = await req.json();

        if (!type || !['topup', 'subscription'].includes(type)) {
            return new Response("Invalid purchase type", { status: 400 });
        }

        // 3. Define Price ID (Using the IDs created previously)
        // PRO: price_1ShPw5BVTET8Q6Fvlmuy7FjS
        // TOPUP ($50): price_1ShPw5BVTET8Q6FvdQASRy5n
        const priceId = type === 'subscription'
            ? "price_1ShPw5BVTET8Q6Fvlmuy7FjS"
            : "price_1ShPw5BVTET8Q6FvdQASRy5n";

        // 4. Create Checkout Session
        console.log(`🛒 Creating checkout session for ${user.id} (${type})`);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: type === 'subscription' ? "payment" : "payment",
            payment_intent_data: type === 'topup' ? {
                setup_future_usage: "off_session",
            } : undefined,
            success_url: success_url || `${req.headers.get("origin")}/billing?success=true`,
            cancel_url: cancel_url || `${req.headers.get("origin")}/billing?canceled=true`,
            metadata: {
                profile_id: user.id,
                type: type,
            },
            customer_email: user.email,
        });

        return new Response(JSON.stringify({ url: session.url }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        console.error(`❌ Checkout error: ${error.message}`);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
