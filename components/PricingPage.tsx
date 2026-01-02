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

type PricingTier = 'pay-as-you-go' | 'pro' | 'agency';

const PricingPage: React.FC<PricingPageProps> = ({ onSignup, onLogin, onBack }) => {
    const [activeTier, setActiveTier] = useState<PricingTier>('pay-as-you-go');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
                            <button onClick={() => { }} className="text-[#1F5EA9] font-bold">Pricing</button>
                            <button onClick={onBack} className="hover:text-[#1F5EA9] transition-colors">FAQ</button>
                        </div>

                        {/* Actions */}
                        <div className="hidden md:flex items-center gap-4">
                            <button
                                onClick={onLogin}
                                className="text-slate-600 hover:text-[#1F5EA9] font-medium text-sm transition-colors"
                            >
                                Log in
                            </button>
                            <button
                                onClick={onSignup}
                                className="bg-[#1F5EA9] hover:bg-[#164E87] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Connect ActBlue
                            </button>
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
                        <button onClick={() => setIsMobileMenuOpen(false)} className="block text-[#1F5EA9] font-bold w-full text-left">Pricing</button>
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

                {/* Toggle */}
                <div className="flex justify-center mb-16">
                    <div className="bg-white p-1.5 rounded-full border border-slate-200 shadow-sm inline-flex relative">
                        {/* Sliding Background - Simplified for now with absolute positioning or Conditional Rendering */}
                        {(['pay-as-you-go', 'pro', 'agency'] as const).map((tier) => (
                            <button
                                key={tier}
                                onClick={() => setActiveTier(tier)}
                                className={`
                                    relative px-6 py-2.5 rounded-full text-sm font-bold transition-all z-10 capitalize whitespace-nowrap
                                    ${activeTier === tier
                                        ? 'bg-[#00204E] text-white shadow-md'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }
                                `}
                            >
                                {tier.replace(/-/g, ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="transition-all duration-300 ease-in-out">

                    {/* PAY AS YOU GO */}
                    {activeTier === 'pay-as-you-go' && (
                        <div className="max-w-md mx-auto">
                            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-5">
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

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                                        <span className="text-slate-700 font-medium">Postcard builder</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                                        <span className="text-slate-700 font-medium">ActBlue integration</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                                        <span className="text-slate-700 font-medium">Personalization</span>
                                    </div>
                                </div>

                                <button onClick={onSignup} className="w-full py-4 bg-[#1F5EA9] hover:bg-[#164E87] text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2">
                                    Get Started <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* PRO PLANS */}
                    {activeTier === 'pro' && (
                        <div>
                            {/* Pro Header Features */}
                            <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 max-w-4xl mx-auto mb-10 text-center">
                                <h4 className="text-[#00204E] font-bold mb-4 flex items-center justify-center gap-2">
                                    <Sparkles size={18} className="text-amber-500" />
                                    Pro includes everything in Pay-as-you-go, plus:
                                </h4>
                                <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-slate-700">
                                    <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-blue-600" /> Remove branding</div>
                                    <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-blue-600" /> First-class mailing</div>
                                    <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-blue-600" /> Return mailbox</div>
                                    <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-blue-600" /> Speedy delivery</div>
                                    <div className="flex items-center gap-2 opacity-60"><CheckCircle2 size={14} className="text-slate-400" /> QR code (Coming soon)</div>
                                    <div className="flex items-center gap-2 opacity-60"><CheckCircle2 size={14} className="text-slate-400" /> Variation testing (Coming soon)</div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Starter */}
                                <div className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-blue-200 transition-all hover:shadow-lg">
                                    <h3 className="text-lg font-bold text-[#00204E] mb-4">Starter</h3>
                                    <div className="flex items-baseline gap-1 mb-1">
                                        <span className="text-3xl font-serif font-bold text-[#00204E]">$99</span>
                                        <span className="text-slate-400 text-xs text-medium">/mo</span>
                                    </div>
                                    <div className="text-sm text-[#1F5EA9] font-bold mb-4">+ $0.99 / postcard</div>

                                    <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-6">
                                        Includes <strong className="text-slate-700">125 cards/mo</strong>
                                    </div>
                                    <button onClick={onSignup} className="w-full py-3 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-700 text-slate-700 rounded-xl font-bold transition-all text-sm">
                                        Start Starter
                                    </button>
                                </div>

                                {/* Grow */}
                                <div className="bg-white rounded-3xl p-6 border-2 border-[#1F5EA9] shadow-xl relative transform md:-translate-y-4">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1F5EA9] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap">
                                        Most Popular
                                    </div>
                                    <h3 className="text-lg font-bold text-[#00204E] mb-4">Grow</h3>
                                    <div className="flex items-baseline gap-1 mb-1">
                                        <span className="text-3xl font-serif font-bold text-[#1F5EA9]">$199</span>
                                        <span className="text-slate-400 text-xs text-medium">/mo</span>
                                    </div>
                                    <div className="text-sm text-[#1F5EA9] font-bold mb-4">+ $0.89 / postcard</div>

                                    <div className="text-xs text-slate-500 bg-blue-50 p-3 rounded-lg border border-blue-100 mb-6">
                                        Includes <strong className="text-blue-900">250 cards/mo</strong>
                                    </div>
                                    <button onClick={onSignup} className="w-full py-3 bg-[#1F5EA9] hover:bg-[#164E87] text-white rounded-xl font-bold transition-all text-sm shadow-lg shadow-blue-900/20">
                                        Start Grow
                                    </button>
                                </div>

                                {/* Scale */}
                                <div className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-blue-200 transition-all hover:shadow-lg">
                                    <h3 className="text-lg font-bold text-[#00204E] mb-4">Scale</h3>
                                    <div className="flex items-baseline gap-1 mb-1">
                                        <span className="text-3xl font-serif font-bold text-[#00204E]">$399</span>
                                        <span className="text-slate-400 text-xs text-medium">/mo</span>
                                    </div>
                                    <div className="text-sm text-[#1F5EA9] font-bold mb-4">+ $0.79 / postcard</div>

                                    <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-6">
                                        Includes <strong className="text-slate-700">500 cards/mo</strong>
                                    </div>
                                    <button onClick={onSignup} className="w-full py-3 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-700 text-slate-700 rounded-xl font-bold transition-all text-sm">
                                        Start Scale
                                    </button>
                                </div>

                                {/* Custom */}
                                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 opacity-90 hover:opacity-100 transition-all">
                                    <h3 className="text-lg font-bold text-[#00204E] mb-4">High Volume</h3>
                                    <div className="flex items-baseline gap-1 mb-1">
                                        <span className="text-3xl font-serif font-bold text-slate-700">Custom</span>
                                    </div>
                                    <div className="text-sm text-slate-500 font-medium mb-4">Contact us for pricing</div>

                                    <div className="text-xs text-slate-500 bg-white p-3 rounded-lg border border-slate-200 mb-6">
                                        For <strong className="text-slate-700">500+ cards/mo</strong>
                                    </div>
                                    <button onClick={() => window.location.href = 'mailto:sales@thankdonors.com'} className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-bold transition-all text-sm">
                                        Contact Sales
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AGENCY PLANS */}
                    {activeTier === 'agency' && (
                        <div>
                            <div className="bg-purple-50/50 rounded-2xl p-6 border border-purple-100 max-w-4xl mx-auto mb-10 text-center">
                                <h4 className="text-[#00204E] font-bold mb-4 flex items-center justify-center gap-2">
                                    <ShieldCheck size={18} className="text-purple-600" />
                                    Agency includes everything in Pro, plus:
                                </h4>
                                <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-slate-700">
                                    <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-purple-600" /> Multiple accounts (Agency only)</div>
                                    <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-purple-600" /> White-label reporting</div>
                                    <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-purple-600" /> Priority Support</div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                                {/* Agency Starter */}
                                <div className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-purple-200 transition-all hover:shadow-lg">
                                    <h3 className="text-lg font-bold text-[#00204E] mb-4">Starter</h3>
                                    <div className="flex items-baseline gap-1 mb-1">
                                        <span className="text-3xl font-serif font-bold text-[#00204E]">$499</span>
                                        <span className="text-slate-400 text-xs text-medium">/mo</span>
                                    </div>
                                    <div className="text-sm text-[#1F5EA9] font-bold mb-4">+ $0.89 / postcard</div>

                                    <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-6">
                                        Includes <strong className="text-slate-700">500 cards/mo</strong>
                                    </div>
                                    <button onClick={onSignup} className="w-full py-3 bg-white border border-slate-200 hover:border-purple-500 hover:text-purple-700 text-slate-700 rounded-xl font-bold transition-all text-sm">
                                        Start Agency
                                    </button>
                                </div>

                                {/* Agency Grow */}
                                <div className="bg-white rounded-3xl p-6 border-2 border-purple-600 shadow-xl relative transform md:-translate-y-4">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap">
                                        Recommended
                                    </div>
                                    <h3 className="text-lg font-bold text-[#00204E] mb-4">Grow</h3>
                                    <div className="flex items-baseline gap-1 mb-1">
                                        <span className="text-3xl font-serif font-bold text-purple-700">$995</span>
                                        <span className="text-slate-400 text-xs text-medium">/mo</span>
                                    </div>
                                    <div className="text-sm text-[#1F5EA9] font-bold mb-4">+ $0.79 / postcard</div>

                                    <div className="text-xs text-slate-500 bg-purple-50 p-3 rounded-lg border border-purple-100 mb-6">
                                        Includes <strong className="text-purple-900">1,000 cards/mo</strong>
                                    </div>
                                    <button onClick={onSignup} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all text-sm shadow-lg shadow-purple-900/20">
                                        Start Agency Grow
                                    </button>
                                </div>

                                {/* Agency Scale */}
                                <div className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-purple-200 transition-all hover:shadow-lg">
                                    <h3 className="text-lg font-bold text-[#00204E] mb-4">Scale</h3>
                                    <div className="flex items-baseline gap-1 mb-1">
                                        <span className="text-3xl font-serif font-bold text-[#00204E]">$1,995</span>
                                        <span className="text-slate-400 text-xs text-medium">/mo</span>
                                    </div>
                                    <div className="text-sm text-[#1F5EA9] font-bold mb-4">+ $0.74 / postcard</div>

                                    <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-6">
                                        Includes <strong className="text-slate-700">2,500 cards/mo</strong>
                                    </div>
                                    <button onClick={onSignup} className="w-full py-3 bg-white border border-slate-200 hover:border-purple-500 hover:text-purple-700 text-slate-700 rounded-xl font-bold transition-all text-sm">
                                        Start Agency Scale
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* COMPARISON TABLE */}
                <div className="mt-24 max-w-5xl mx-auto">
                    <h2 className="text-3xl font-serif font-bold text-[#00204E] mb-12 text-center">Compare Features</h2>

                    <div className="overflow-x-auto">
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
                                    { name: 'Postcard builder', free: true, pro: true, agency: true },
                                    { name: 'ActBlue integration', free: true, pro: true, agency: true },
                                    { name: 'Personalization', free: true, pro: true, agency: true },
                                    { name: 'Remove branding', free: false, pro: true, agency: true },
                                    { name: 'First-class mailing', free: false, pro: true, agency: true },
                                    { name: 'Return mailbox', free: false, pro: true, agency: true },
                                    { name: 'Speedy delivery', free: false, pro: true, agency: true },
                                    { name: 'Multiple accounts', free: false, pro: false, agency: true },
                                    { name: 'QR code', free: false, pro: 'Coming soon', agency: 'Coming soon' },
                                    { name: 'Variations', free: false, pro: 'Coming soon', agency: 'Coming soon' },
                                ].map((feature, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 pl-4 font-medium text-slate-700">{feature.name}</td>
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

                {/* Bottom CTA */}
                <div className="mt-24 text-center">
                    <p className="text-slate-500 mb-6">Unsure which plan is right for you?</p>
                    <button onClick={() => window.location.href = 'mailto:support@thankdonors.com'} className="text-[#1F5EA9] font-bold hover:underline">Chat with our team</button>
                </div>
            </div>

            {/* Footer - Minimal */}
            <footer className="bg-white border-t border-slate-100 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-white">
                            <Heart size={12} fill="currentColor" className="text-slate-400" />
                        </div>
                        <span className="text-slate-400 font-serif font-bold">Thank Donors</span>
                    </div>
                    <p className="text-xs text-slate-400">© 2026 Thank Donors Inc. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default PricingPage;
