import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    CheckCircle2,
    ShieldCheck,
    CreditCard,
    HelpCircle,
    ChevronDown,
    ChevronUp,
    ArrowRight,
    Loader2,
    Check
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { ActBlueEntity } from '../types';
import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

const SubscriptionFlow: React.FC = () => {
    const { entityId } = useParams<{ entityId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'payg' | 'pro'>('pro');
    const [selectedTier, setSelectedTier] = useState<'starter' | 'grow' | 'scale'>('starter');
    const [expandedFaq, setExpandedFaq] = useState<number | null>(0); // Open first by default
    const [showAgency, setShowAgency] = useState(false); // Toggle for agency view in FAQs
    const [bookingOpen, setBookingOpen] = useState(false);

    useEffect(() => {
        (async function () {
            const cal = await getCalApi({ "namespace": "pro-custom-pricing-quote" });
            cal("ui", { "theme": "dark", "hideEventTypeDetails": false, "layout": "month_view" });
        })();
    }, []);

    const FAQs = [
        {
            question: "Is my payment secure?",
            answer: "Yes, all payments are processed securely via Stripe. We do not store your card details."
        },
        {
            question: "What payment methods are accepted?",
            answer: "We accept all major credit cards and debit cards."
        },
        {
            question: "Where do I find agency plans?",
            answer: (
                <span>
                    Agency plans with multiple accounts are available{' '}
                    <button
                        onClick={() => setShowAgency(!showAgency)}
                        className="text-[#1F5EA9] font-bold hover:underline"
                    >
                        here
                    </button>.
                </span>
            )
        },
        {
            question: "What if I have more than 500 donations per month?",
            answer: (
                <span>
                    We have plans for high-volume sending ({'>'} 500 cards/mo) that are available.{' '}
                    <button
                        onClick={() => setBookingOpen(true)}
                        className="text-[#1F5EA9] font-bold hover:underline"
                    >
                        Contact us
                    </button>.
                </span>
            )
        }
    ];

    const PRO_TIERS = {
        starter: { name: 'Pro Starter', price: 99, cards: 125, perCard: 0.99 },
        grow: { name: 'Pro Grow', price: 199, cards: 250, perCard: 0.89 },
        scale: { name: 'Pro Scale', price: 399, cards: 500, perCard: 0.79 },
    };

    const handleContinue = async () => {
        if (!entityId) return;
        setLoading(true);

        try {
            if (selectedPlan === 'payg') {
                // Determine user session
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error("No session");

                // Update entity tier to pay_as_you_go
                const { error } = await supabase
                    .from('actblue_entities')
                    .update({ tier: 'pay_as_you_go' })
                    .eq('id', parseInt(entityId));

                if (error) throw error;

                // Navigate to dashboard
                navigate(`/entities/${entityId}/dashboard`);
            } else {
                // Trigger Polar Checkout for Pro
                // Mapping selection to Polar Tiers (You would replace these with actual IDs or handle inside the edge function)
                let tierParam = `pro_${selectedTier}`;

                const { data: { session } } = await supabase.auth.getSession();

                const response = await fetch(`${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token}`
                    },
                    body: JSON.stringify({
                        type: 'subscription',
                        entity_id: parseInt(entityId),
                        tier: tierParam
                    })
                });

                const { url, error } = await response.json();
                if (error) throw new Error(error);
                if (url) window.location.href = url;
            }
        } catch (err) {
            console.error('Error in subscription flow:', err);
            alert('Something went wrong. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans selection:bg-blue-100 selection:text-[#00204E]">

            {/* Left Column: Context & FAQ */}
            <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-20 bg-slate-50 flex flex-col justify-center">
                <div className="max-w-lg mx-auto w-full">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#00204E] mb-8">
                        Complete payment
                    </h1>

                    <div className="space-y-4">
                        {FAQs.map((faq, index) => (
                            <div key={index} className="border-b border-slate-200 pb-4">
                                <button
                                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                    className="w-full flex justify-between items-center text-left"
                                >
                                    <span className="font-bold text-[#00204E] text-lg">{faq.question}</span>
                                    {expandedFaq === index ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                                </button>
                                {expandedFaq === index && (
                                    <div className="mt-2 text-slate-600 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {showAgency && (
                        <div className="mt-8 p-6 bg-purple-50 rounded-2xl border border-purple-100 animate-in zoom-in-95 duration-200">
                            <h3 className="text-purple-900 font-bold text-lg mb-2">Agency Plans</h3>
                            <p className="text-purple-700 text-sm mb-4">
                                Managing multiple accounts? Our agency plans start at $499/mo including 5 accounts and 625 cards.
                            </p>
                            <button onClick={() => setBookingOpen(true)} className="text-sm font-bold bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                                Contact Agency Sales
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Selection */}
            <div className="w-full md:w-1/2 p-4 md:p-8 lg:p-12 flex items-center justify-center bg-white shadow-2xl shadow-slate-200/50 relative z-10">
                <div className="max-w-md w-full">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-serif font-bold text-[#00204E] mb-6">Select your plan</h2>

                        {/* Toggle */}
                        <div className="inline-flex bg-slate-100 p-1 rounded-full relative">
                            <button
                                onClick={() => setSelectedPlan('payg')}
                                className={`px-6 py-2 rounded-full text-sm font-bold transition-all relative z-10 ${selectedPlan === 'payg' ? 'bg-white text-[#00204E] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Pay As You Go
                            </button>
                            <button
                                onClick={() => setSelectedPlan('pro')}
                                className={`px-6 py-2 rounded-full text-sm font-bold transition-all relative z-10 ${selectedPlan === 'pro' ? 'bg-[#1F5EA9] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Pro Plans
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        {selectedPlan === 'pro' ? (
                            <>
                                {Object.entries(PRO_TIERS).map(([key, tier]) => (
                                    <div
                                        key={key}
                                        onClick={() => setSelectedTier(key as any)}
                                        className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all ${selectedTier === key
                                                ? 'border-[#1F5EA9] bg-blue-50/10 shadow-lg shadow-blue-900/5'
                                                : 'border-slate-100 hover:border-blue-200 bg-white'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className="font-bold text-[#00204E] text-lg">{tier.name}</h3>
                                            {selectedTier === key && <div className="w-6 h-6 bg-[#1F5EA9] rounded-full flex items-center justify-center"><Check size={14} className="text-white" /></div>}
                                        </div>
                                        <div className="flex items-baseline gap-1 mb-2">
                                            <span className="text-3xl font-bold text-[#00204E]">${tier.price}</span>
                                            <span className="text-slate-500 font-medium">/mo</span>
                                        </div>
                                        <p className="text-sm text-slate-500">
                                            First <span className="font-bold text-slate-700">{tier.cards} cards</span> @ ${tier.perCard}/ea
                                        </p>
                                    </div>
                                ))}
                            </>
                        ) : (
                            // PAYG Card
                            <div className="p-8 rounded-2xl border-2 border-slate-200 bg-slate-50/50 text-center">
                                <h3 className="font-bold text-[#00204E] text-xl mb-2">Pay As You Go</h3>
                                <div className="flex items-center justify-center gap-1 mb-4">
                                    <span className="text-4xl font-bold text-[#00204E]">$0.79</span>
                                    <span className="text-slate-500 font-medium">/card</span>
                                </div>
                                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                                    No monthly fees. No minimums.<br />Just pay for what you send.
                                </p>
                                <ul className="text-left space-y-2 mb-0 inline-block">
                                    <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-green-600" /> Standard Delivery</li>
                                    <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-green-600" /> Postcard Builder</li>
                                </ul>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleContinue}
                        disabled={loading}
                        className="w-full py-4 bg-[#1F5EA9] hover:bg-[#164E87] text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading && <Loader2 className="animate-spin" size={20} />}
                        {selectedPlan === 'payg' ? 'Get Started' : 'Continue'}
                    </button>

                    <p className="text-center text-xs text-slate-400 mt-6">
                        By continuing, you agree to our Terms of Service.
                    </p>
                </div>
            </div>

            {/* Booking Modal */}
            {bookingOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="flex justify-end p-4">
                            <button onClick={() => setBookingOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition">
                                <span className="sr-only">Close</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
                            </button>
                        </div>
                        <div className="flex-grow">
                            <Cal
                                namespace="pro-custom-pricing-quote"
                                calLink="thank-donors/pro-custom-pricing-quote"
                                style={{ width: "100%", height: "100%", overflow: "scroll" }}
                                config={{ "layout": "month_view", "theme": "light" }}
                            />
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default SubscriptionFlow;
