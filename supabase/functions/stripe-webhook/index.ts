
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import Stripe from "https://esm.sh/stripe@14.16.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY") || "", {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const signature = req.headers.get("stripe-signature");
        if (!signature) {
            return new Response("Missing stripe-signature", { status: 400 });
        }

        const body = await req.text();
        const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

        let event;
        try {
            event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret || "");
        } catch (err) {
            console.error(`❌ Webhook signature verification failed: ${err.message}`);
            return new Response(`Webhook Error: ${err.message}`, { status: 400 });
        }

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") || "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
        );

        console.log(`🔔 Received Stripe event: ${event.type}`);

        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                const profileId = session.metadata?.profile_id;
                const type = session.metadata?.type; // 'topup' or 'subscription'

                if (!profileId) {
                    console.error("❌ Missing profile_id in session metadata");
                    break;
                }

                if (type === "topup") {
                    const amountCents = session.amount_total; // This is the total charged
                    console.log(`💰 Fulfilling topup for ${profileId}: ${amountCents} cents`);

                    // Update balance
                    const { data: profile, error: fetchError } = await supabase
                        .from('profiles')
                        .select('balance_cents')
                        .eq('id', profileId)
                        .single();

                    if (fetchError) throw fetchError;

                    const newBalance = (profile.balance_cents || 0) + amountCents;
                    const { error: updateError } = await supabase
                        .from('profiles')
                        .update({
                            balance_cents: newBalance,
                            stripe_customer_id: session.customer as string
                        })
                        .eq('id', profileId);

                    if (updateError) throw updateError;

                    // Record transaction
                    await supabase.from('billing_transactions').insert({
                        profile_id: profileId,
                        amount_cents: amountCents,
                        type: 'topup',
                        description: `Credit top-up via Stripe`,
                        stripe_payment_intent_id: session.payment_intent as string
                    });
                }

                if (type === "subscription") {
                    console.log(`🚀 Upgrading user ${profileId} to Pro tier`);
                    const { error: updateError } = await supabase
                        .from('profiles')
                        .update({
                            tier: 'pro',
                            stripe_customer_id: session.customer as string
                        })
                        .eq('id', profileId);

                    if (updateError) throw updateError;
                }
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object;
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('stripe_customer_id', subscription.customer)
                    .single();

                if (profile) {
                    console.log(`📉 Downgrading user ${profile.id} to Free tier (subscription deleted)`);
                    await supabase
                        .from('profiles')
                        .update({ tier: 'free' })
                        .eq('id', profile.id);
                }
                break;
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        console.error(`❌ Webhook error: ${error.message}`);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
