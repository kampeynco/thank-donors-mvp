import React, { useState } from 'react';
import {
    CheckCircle2,
    X,
    Heart,
    Menu,
    ChevronDown,
    ArrowRight,
    HelpCircle,
    Info,
    Mail,
    Zap,
    QrCode,
    Sparkles,
    ShieldCheck
} from 'lucide-react';

interface PricingPageProps {
    onSignup: () => void;
    onLogin: () => void;
    onBack: () => void;
}

type PricingContext = 'pro' | 'agency';

const PRO_TIERS = [
    { name: 'Starter', price: 99, cards: 125, perCard: 0.99 },
    { name: 'Grow', price: 199, cards: 250, perCard: 0.89 },
    { name: 'Scale', price: 399, cards: 500, perCard: 0.79 },
    { name: 'High Volume', isCustom: true, price: 'Custom', cards: '500+', perCard: 'Custom' }
];

const AGENCY_TIERS = [
    { name: 'Starter', price: 499, cards: 625, perCard: 0.99 },
    { name: 'Grow', price: 995, cards: 1250, perCard: 0.89 },
    { name: 'Scale', price: 1995, cards: 2500, perCard: 0.79 },
    { name: 'High Volume', isCustom: true, price: 'Custom', cards: '2,500+', perCard: 'Custom' }
];

const PricingPage: React.FC<PricingPageProps> = ({ onSignup, onLogin, onBack }) => {
    const [activeContext, setActiveContext] = useState<PricingContext>('pro');
    const [sliderValue, setSliderValue] = useState(1); // Default to 'Grow' (index 1)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const currentTiers = activeContext === 'pro' ? PRO_TIERS : AGENCY_TIERS;
    const selectedTier = currentTiers[sliderValue];
    const isCustom = selectedTier.isCustom;

    const handleContextChange = (context: PricingContext) => {
        setActiveContext(context);
        setSliderValue(1); // Reset to Grow tier on switch
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-[#00204E]">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
                            <div className="w-8 h-8 bg-[#1F5EA9] rounded-full flex items-center justify-center text-white">
                                <Heart size={18} fill="currentColor" />
                            </div>
                            <div>
                                <span className="text-xl font-serif font-bold text-[#00204E] tracking-tight block leading-none">Thank Donors</span>
                                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">Automated Gratitude</span>
                            </div>
                        </div>

                        {/* Desktop Links */}
                        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                            <button onClick={onBack} className="hover:text-[#1F5EA9] transition-colors">How it Works</button>
                            <button onClick={onBack} className="hover:text-[#1F5EA9] transition-colors">Features</button>
                            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-[#1F5EA9] font-bold">Pricing</button>
                            <button onClick={onBack} className="hover:text-[#1F5EA9] transition-colors">FAQ</button>
                        </div>

                        {/* Actions */}
                        <div className="hidden md:flex items-center gap-4">
                            <button onClick={onLogin} className="text-slate-600 hover:text-[#1F5EA9] font-medium text-sm transition-colors">Log in</button>
                            <button onClick={onSignup} className="bg-[#1F5EA9] hover:bg-[#164E87] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]">Connect ActBlue</button>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600">
                                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-slate-100 py-4 px-4 space-y-4">
                        <button onClick={() => { onBack(); setIsMobileMenuOpen(false); }} className="block text-slate-600 font-medium w-full text-left">How it Works</button>
                        <button onClick={() => { onBack(); setIsMobileMenuOpen(false); }} className="block text-slate-600 font-medium w-full text-left">Features</button>
                        <button onClick={() => { setIsMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="block text-[#1F5EA9] font-bold w-full text-left">Pricing</button>
                        <button onClick={() => { onBack(); setIsMobileMenuOpen(false); }} className="block text-slate-600 font-medium w-full text-left">FAQ</button>
                        <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                            <button onClick={onLogin} className="w-full py-2 text-slate-600 font-bold border border-slate-200 rounded-xl">Log in</button>
                            <button onClick={onSignup} className="w-full py-2 bg-[#1F5EA9] text-white font-bold rounded-xl shadow-lg shadow-blue-900/20">Connect ActBlue</button>
                        </div>
                    </div>
                )}
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pb-32">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-[#00204E] tracking-tight mb-6">
                        Start mailing thank-you postcards today.<br />
                        <span className="text-[#1F5EA9] italic">Scale when you're ready.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600">
                        Pay as you go now. Upgrade for lower per-postcard costs and pro deliverability options.
                    </p>
                </div>

                {/* Toggle - Simplified */}
                <div className="flex justify-center mb-16">
                    <div className="bg-white p-1.5 rounded-full border border-slate-200 shadow-sm inline-flex relative">
                        <button
                            onClick={() => handleContextChange('pro')}
                            className={`
                                relative px-8 py-2.5 rounded-full text-sm font-bold transition-all z-10 
                                ${activeContext === 'pro'
                                    ? 'bg-[#00204E] text-white shadow-md'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                }
                            `}
                        >
                            Standard
                        </button>
                        <button
                            onClick={() => handleContextChange('agency')}
                            className={`
                                relative px-8 py-2.5 rounded-full text-sm font-bold transition-all z-10 flex items-center gap-2
                                ${activeContext === 'agency'
                                    ? 'bg-[#00204E] text-white shadow-md'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                }
                            `}
                        >
                            For Agencies
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="transition-all duration-300 ease-in-out">

                    {/* VIEW: PRO (Standard) */}
                    {activeContext === 'pro' && (
                        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-start">

                            {/* Card 1: Pay-as-you-go (Static) */}
                            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg relative h-full flex flex-col">
                                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                                    <Zap size={100} />
                                </div>
                                <div className="mb-8">
                                    <h3 className="text-2xl font-bold text-[#00204E] mb-2">Pay-as-you-go</h3>
                                    <div className="flex items-baseline gap-1 mb-2">
                                        <span className="text-5xl font-serif font-bold text-[#1F5EA9]">$1.99</span>
                                        <span className="text-slate-500 text-sm font-medium">/ postcard</span>
                                    </div>
                                    <p className="text-slate-500 text-sm">No monthly fee. Just pay for what you send.</p>
                                </div>

                                <div className="space-y-4 mb-8 flex-grow">
                                    {['Postcard builder', 'ActBlue integration', 'Personalization'].map(f => (
                                        <div key={f} className="flex items-center gap-3">
                                            <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                                            <span className="text-slate-700 font-medium">{f}</span>
                                        </div>
                                    ))}
                                </div>

                                <button onClick={onSignup} className="w-full py-4 bg-white border-2 border-slate-200 hover:border-[#1F5EA9] hover:text-[#1F5EA9] text-slate-600 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                                    Get Started
                                </button>
                            </div>

                            {/* Card 2: Pro Dynamic (Interactive) */}
                            <div className="bg-[#00204E] rounded-3xl p-8 border border-blue-900 shadow-xl relative text-white">
                                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                                    <Sparkles size={100} />
                                </div>
                                <div className="absolute -top-4 left-8 bg-amber-400 text-[#00204E] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                    Most Popular
                                </div>

                                {/* Slider Section */}
                                <div className="mb-10 w-full">
                                    <label className="text-sm font-bold text-blue-200 mb-4 block uppercase tracking-wide">
                                        Monthly Volume
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="3"
                                        step="1"
                                        value={sliderValue}
                                        onChange={(e) => setSliderValue(Number(e.target.value))}
                                        className="w-full h-2 bg-blue-900 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:accent-amber-300 transition-all"
                                    />
                                    <div className="flex justify-between text-[10px] items-center mt-3 text-blue-300/50 font-medium px-1">
                                        <span>125</span>
                                        <span>250</span>
                                        <span>500</span>
                                        <span>500+</span>
                                    </div>
                                </div>

                                {/* Dynamic Content */}
                                <div className="mb-8">
                                    <h3 className="text-xl font-medium text-blue-200 mb-1">{selectedTier.name}</h3>

                                    {isCustom ? (
                                        <div className="flex items-baseline gap-1 mb-2">
                                            <span className="text-5xl font-serif font-bold text-white">Custom</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-baseline gap-1 mb-2">
                                            <span className="text-5xl font-serif font-bold text-white">${selectedTier.price}</span>
                                            <span className="text-blue-300 text-sm font-medium">/ mo</span>
                                        </div>
                                    )}

                                    {isCustom ? (
                                        <div className="text-blue-300 text-sm font-medium h-5">Contact us for pricing</div>
                                    ) : (
                                        <div className="text-amber-400 text-sm font-bold h-5">+ ${selectedTier.perCard} / postcard</div>
                                    )}
                                </div>

                                <div className="bg-blue-900/30 rounded-xl p-4 border border-blue-800/50 mb-8 backdrop-blur-sm">
                                    {isCustom ? (
                                        <div className="text-sm text-blue-100">
                                            For high-volume campaigns needing <strong className="text-white">500+ cards/mo</strong>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-blue-100">
                                            First <strong className="text-white">{selectedTier.cards} cards/mo</strong> at this rate
                                            <div className="mt-1 text-blue-300/80 text-xs">$1.99/card thereafter</div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-2">Everything in Pay-as-you-go, plus:</div>
                                    {['Remove branding', 'First-class mailing', 'Return mailbox', 'Speedy delivery'].map(f => (
                                        <div key={f} className="flex items-center gap-3">
                                            <CheckCircle2 size={18} className="text-amber-400 flex-shrink-0" />
                                            <span className="text-blue-50 font-medium">{f}</span>
                                        </div>
                                    ))}
                                </div>

                                {isCustom ? (
                                    <button onClick={() => window.location.href = 'mailto:sales@thankdonors.com'} className="w-full py-4 bg-white hover:bg-blue-50 text-[#00204E] rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2">
                                        Contact Sales
                                    </button>
                                ) : (
                                    <button onClick={onSignup} className="w-full py-4 bg-[#1F5EA9] hover:bg-[#3475c1] text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 border border-blue-400/30">
                                        Start Pro Plan <ArrowRight size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}



                    {/* VIEW: AGENCY */}
                    {activeContext === 'agency' && (
                        <div className="max-w-2xl mx-auto">
                            <div className="bg-white rounded-3xl p-8 border-2 border-purple-100 shadow-xl relative">
                                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                                    <ShieldCheck size={120} className="text-purple-600" />
                                </div>
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg shadow-purple-900/20">
                                    Agency Partners
                                </div>

                                {/* Slider Section */}
                                <div className="mb-12 mt-4 px-4">
                                    <div className="flex justify-between items-end mb-6">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                                            Monthly Volume
                                        </label>
                                        <div className="text-2xl font-bold text-purple-700 font-serif">
                                            {selectedTier.cards} <span className="text-sm font-sans text-slate-400 font-medium">cards</span>
                                        </div>
                                    </div>

                                    <input
                                        type="range"
                                        min="0"
                                        max="3"
                                        step="1"
                                        value={sliderValue}
                                        onChange={(e) => setSliderValue(Number(e.target.value))}
                                        className="w-full h-3 bg-purple-50 rounded-lg appearance-none cursor-pointer accent-purple-600 hover:accent-purple-700 transition-all border border-purple-100"
                                    />
                                    <div className="flex justify-between text-[10px] items-center mt-3 text-slate-400 font-medium px-1">
                                        <span>625</span>
                                        <span>1,250</span>
                                        <span>2,500</span>
                                        <span>2,500+</span>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-8 items-center border-t border-slate-100 pt-8">
                                    <div className="flex-1 text-center md:text-left">
                                        <h3 className="text-xl font-bold text-[#00204E] mb-2">{selectedTier.name}</h3>

                                        {isCustom ? (
                                            <div className="flex items-baseline justify-center md:justify-start gap-1 mb-2">
                                                <span className="text-4xl font-serif font-bold text-slate-700">Custom</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-baseline justify-center md:justify-start gap-1 mb-2">
                                                <span className="text-4xl font-serif font-bold text-[#00204E]">${selectedTier.price}</span>
                                                <span className="text-slate-400 text-sm font-medium">/ mo</span>
                                            </div>
                                        )}

                                        {isCustom ? (
                                            <div className="text-purple-600 text-sm font-bold">Contact for pricing</div>
                                        ) : (
                                            <div className="text-purple-600 text-sm font-bold">+ ${selectedTier.perCard} / postcard</div>
                                        )}
                                    </div>

                                    <div className="flex-1 w-full">
                                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 mb-6">
                                            {isCustom ? (
                                                <div className="text-sm text-slate-600">
                                                    For agencies needing <strong className="text-purple-900">2,500+ cards/mo</strong>. includes multiple accounts.
                                                </div>
                                            ) : (
                                                <div className="text-sm text-slate-600">
                                                    First <strong className="text-purple-900">{selectedTier.cards} cards/mo</strong> at this rate
                                                    <div className="mt-1 text-slate-400 text-xs">$1.99/card thereafter</div>
                                                </div>
                                            )}
                                        </div>

                                        {isCustom ? (
                                            <button onClick={() => window.location.href = 'mailto:sales@thankdonors.com'} className="w-full py-3 bg-white border border-slate-200 hover:border-purple-300 hover:text-purple-700 text-slate-600 rounded-xl font-bold transition-all shadow-sm">
                                                Contact Sales
                                            </button>
                                        ) : (
                                            <button onClick={onSignup} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-900/20">
                                                Start Agency Plan
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-slate-600">
                                        <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-purple-600" /> Multiple accounts</div>
                                        <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-purple-600" /> Priority Support</div>
                                        <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-purple-600" /> API Access</div>
                                        <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-purple-600" /> White-labeling</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* COMPARISON TABLE */}
                <div className="mt-24 max-w-5xl mx-auto">
                    <h2 className="text-3xl font-serif font-bold text-[#00204E] mb-12 text-center">Compare Features</h2>

                    <div className="">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-slate-100">
                                    <th className="py-4 pl-4 text-sm font-bold text-slate-500 uppercase tracking-wider w-1/4">Feature</th>
                                    <th className="py-4 px-4 text-sm font-bold text-[#00204E] text-center w-1/4">Pay-as-you-go</th>
                                    <th className="py-4 px-4 text-sm font-bold text-[#1F5EA9] text-center w-1/4 bg-blue-50/30 rounded-t-xl">Pro</th>
                                    <th className="py-4 px-4 text-sm font-bold text-purple-700 text-center w-1/4">Agency</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {[
                                    { name: 'Postcard builder', desc: 'Build custom postcards in minutes not hours.', free: true, pro: true, agency: true },
                                    { name: 'ActBlue integration', desc: 'Seamlessly sync data from your ActBlue account in real-time.', free: true, pro: true, agency: true },
                                    { name: 'Personalization', desc: 'Use variables like %FirstName% to customize each card.', free: true, pro: true, agency: true },
                                    { name: 'Remove branding', desc: 'Send postcards with no Thank Donors logo.', free: false, pro: true, agency: true },
                                    { name: 'First-class mailing', desc: '3 to 5 business days delivery via USPS.', free: false, pro: true, agency: true },
                                    { name: 'Return handling', desc: 'We manage undeliverable mail and update your database.', free: false, pro: false, agency: true },
                                    { name: 'Priority printing', desc: 'Your order skips the queue and prints within 24 hours.', free: false, pro: false, agency: true },
                                    { name: 'Multiple accounts', desc: 'Manage multiple campaigns from a single dashboard.', free: false, pro: false, agency: true },
                                    { name: 'QR code', desc: 'Add scannable codes to link donors back to your site.', free: false, pro: 'Coming soon', agency: 'Coming soon' },
                                    { name: 'Postcard Variations', desc: 'A/B test different designs to optimize engagement.', free: false, pro: 'Coming soon', agency: 'Coming soon' },
                                ].map((feature, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 pl-4 font-medium text-slate-700 relative group cursor-help w-[fit-content]">
                                            <span className="decoration-dotted underline underline-offset-4 decoration-slate-300">
                                                {feature.name}
                                            </span>
                                            {/* Tooltip */}
                                            <div className="invisible group-hover:visible absolute left-0 bottom-full mb-2 w-48 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                {feature.desc}
                                                <div className="absolute left-4 -bottom-1 w-2 h-2 bg-slate-800 rotate-45"></div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            {typeof feature.free === 'boolean'
                                                ? (feature.free ? <CheckCircle2 size={20} className="mx-auto text-slate-900" /> : <span className="text-slate-300">—</span>)
                                                : <span className="text-slate-500 text-sm">{feature.free}</span>}
                                        </td>
                                        <td className="py-4 px-4 text-center bg-blue-50/20">
                                            {typeof feature.pro === 'boolean'
                                                ? (feature.pro ? <CheckCircle2 size={20} className="mx-auto text-[#1F5EA9]" /> : <span className="text-slate-300">—</span>)
                                                : <span className="text-slate-500 text-xs font-medium bg-slate-100 px-2 py-1 rounded inline-block">{feature.pro}</span>}
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            {typeof feature.agency === 'boolean'
                                                ? (feature.agency ? <CheckCircle2 size={20} className="mx-auto text-purple-600" /> : <span className="text-slate-300">—</span>)
                                                : <span className="text-slate-500 text-xs font-medium bg-purple-50 text-purple-700 px-2 py-1 rounded inline-block">{feature.agency}</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Final CTA Section */}
            <section className="py-24 bg-[#00204E] text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <h2 className="text-4xl md:text-6xl font-serif font-bold tracking-tight mb-8">
                        Stop letting gratitude<br /><span className="text-blue-400">slip through the cracks.</span>
                    </h2>
                    <p className="text-xl text-blue-200 mb-12 max-w-2xl mx-auto">
                        Join 50+ progressive campaigns using automagical direct mail to boost retention.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={onSignup}
                            className="bg-[#1F5EA9] hover:bg-[#164E87] text-white px-8 py-4 rounded-full text-lg font-bold shadow-xl shadow-blue-900/50 transition-all hover:scale-105"
                        >
                            Connect ActBlue
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-100 py-12 md:py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                            <div className="w-8 h-8 bg-[#1F5EA9] rounded-full flex items-center justify-center text-white">
                                <Heart size={16} fill="currentColor" />
                            </div>
                            <div>
                                <span className="text-lg font-serif font-bold text-slate-900 block leading-none">Thank Donors</span>
                                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">Automated Gratitude</span>
                            </div>
                        </div>
                        <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
                            Turning generic ActBlue notifications into personalized, physical postcards that build lasting relationships with your donors.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-slate-500">
                        <button onClick={onLogin} className="hover:text-[#1F5EA9] transition-colors">Log in</button>
                        <a href="#" className="hover:text-[#1F5EA9] transition-colors">Contact Support</a>
                        <a href="#" className="hover:text-[#1F5EA9] transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-[#1F5EA9] transition-colors">Terms of Service</a>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
                    <div>© 2026 Thank Donors Inc. All rights reserved.</div>
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                        <Heart size={10} className="text-[#1F5EA9]" fill="currentColor" />
                        <span>Made for progressive campaigns & organizers</span>
                    </div>
                </div>
            </footer>
        </div >
    );
};

export default PricingPage;
