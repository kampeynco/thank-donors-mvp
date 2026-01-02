
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            throw new Error('Unauthorized');
        }

        const { type, entity_id, tier } = await req.json();

        // Map Tiers to Polar Price IDs
        // USER MUST POPULATE THESE WITH REAL POLAR PRICE IDs
        const POLAR_PRICES: Record<string, string> = {
            // One-time Top-ups
            'topup_50': "price_REPLACE_WITH_POLAR_TOPUP_50_ID",

            // Subscriptions
            'pro_starter': "price_REPLACE_WITH_POLAR_PRO_STARTER_ID",
            'pro_grow': "price_REPLACE_WITH_POLAR_PRO_GROW_ID",
            'pro_scale': "price_REPLACE_WITH_POLAR_PRO_SCALE_ID",
            'agency_starter': "price_REPLACE_WITH_POLAR_AGENCY_STARTER_ID",
            'agency_grow': "price_REPLACE_WITH_POLAR_AGENCY_GROW_ID",
            'agency_scale': "price_REPLACE_WITH_POLAR_AGENCY_SCALE_ID",
        };

        let priceId = "";

        if (type === 'topup') {
            priceId = POLAR_PRICES['topup_50'];
        } else if (type === 'subscription') {
            priceId = POLAR_PRICES[tier] || POLAR_PRICES['pro_starter'];
        }

        if (!priceId) {
            throw new Error(`Invalid price configuration for ${type} / ${tier}`);
        }

        // Call Polar API to create checkout
        // Using standard checkout creation flow
        const polarResponse = await fetch('https://api.polar.sh/v1/checkouts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('POLAR_ACCESS_TOKEN')}`
            },
            body: JSON.stringify({
                product_price_id: priceId,
                success_url: `${req.headers.get('origin')}/settings?billing_success=true`,
                customer_email: user.email,
                metadata: {
                    user_id: user.id,
                    entity_id: entity_id,
                    tier: tier,
                    type: type
                }
            })
        });

        if (!polarResponse.ok) {
            const errorText = await polarResponse.text();
            console.error("Polar API Error:", errorText);
            throw new Error(`Polar API error: ${polarResponse.statusText}. Ensure POLAR_ACCESS_TOKEN is set.`);
        }

        const checkoutData = await polarResponse.json();

        return new Response(
            JSON.stringify({ url: checkoutData.url }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});
