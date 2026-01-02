
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const token = Deno.env.get('POLAR_ACCESS_TOKEN');
        if (!token) throw new Error("POLAR_ACCESS_TOKEN not found in secrets");

        // 1. Get Organization ID
        const orgRes = await fetch('https://api.polar.sh/v1/organizations', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const orgData = await orgRes.json();
        const organization_id = orgData.items?.[0]?.id;

        if (!organization_id) throw new Error("Could not find Organization ID");

        // 2. Define Products to Create
        const productsToCreate = [
            { name: "Top-up Credits ($100)", price_amount: 10000, type: "one_time", key: "topup_100" },
            { name: "Top-up Credits ($250)", price_amount: 25000, type: "one_time", key: "topup_250" },
            { name: "Top-up Credits ($500)", price_amount: 50000, type: "one_time", key: "topup_500" },
        ];

        const createdIds: Record<string, string> = {};

        // 3. Create Products loop
        for (const p of productsToCreate) {
            const body: any = {
                // organization_id, // Implicit with Org Token
                name: p.name,
                prices: [{
                    amount_type: "fixed",
                    price_amount: p.price_amount,
                    price_currency: "usd",
                    type: p.type,
                }]
            };

            console.log(`Creating ${p.name}...`);
            const res = await fetch('https://api.polar.sh/v1/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const txt = await res.text();
                createdIds[p.key] = `ERROR: ${txt}`;
                continue;
            }

            const data = await res.json();
            createdIds[p.key] = data.prices[0].id;
        }

        return new Response(
            JSON.stringify({
                organization_id,
                product_price_ids: createdIds
            }, null, 2),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
