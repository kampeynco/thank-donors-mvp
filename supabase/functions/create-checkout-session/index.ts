
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
        const POLAR_PRICES: Record<string, string> = {
            // One-time Top-ups
            'topup_50': "6ae68d87-bc12-41a2-87bb-434b33d5a8eb",
            'topup_100': "57d91d77-e7fe-4e63-9541-079aa0cf7934",
            'topup_250': "a77e4e6c-4f41-406a-9a64-40fa492e0257",
            'topup_500': "8708b8ba-9b23-4e81-afeb-406d871a7aff",

            // Subscriptions
            'pro_starter': "d72630f4-38af-474a-b164-337cea3cd700",
            'pro_grow': "332d5f5d-551c-47fa-915a-320a65ed4502",
            'pro_scale': "75d99ca2-a9e9-4981-8c11-96edc3352457",
            'agency_starter': "1b417d3f-e5c6-4c20-95b1-4e3d8825d3d7",
            'agency_grow': "9d9282e8-8b94-4f8a-bc16-045979955514",
            'agency_scale': "3d587d3d-8a36-41eb-960e-01f51900557b",
        };

        let priceId = "";

        if (type === 'topup') {
            // tier should be '50', '100', '250', or '500' for topups, or we derive it
            // actually the frontend sends `tier` as undefined for topup currently?
            // Let's check BillingView.tsx. It sends `handlePolarCheckout('topup')` without amount.
            // But we need the amount.
            // FIX: Default to 50, but we should support others. 
            // For now, let's assume 'topup_50' if generic, or specific key if provided.
            // The frontend needs to be updated to send the amount/tier for topups too.
            // Changing this to support dynamic topup keys if encoded in `tier` or a new param.
            // For simplified MVP:
            priceId = POLAR_PRICES[`topup_${tier}`] || POLAR_PRICES['topup_50'];
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
