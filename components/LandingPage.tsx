import React, { useState } from 'react';
import {
    Heart,
    CheckCircle2,
    ArrowRight,
    LayoutDashboard,
    Clock,
    Activity,
    Palette,
    Type,
    Image as ImageIcon,
    Eye,
    Zap,
    Sparkles,
    BarChart3,
    QrCode,
    Search,
    HelpCircle,
    ShieldCheck,
    DollarSign,
    Mail,
    MessageSquare,
    Menu,
    X,
    Webhook,
    AlertTriangle,
    FileText,
    Lock
} from 'lucide-react';

interface LandingPageProps {
    onLogin: () => void;
    onSignup: () => void;
    onPricingClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onSignup, onPricingClick }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-[#00204E]">

            {/* Navigation (Minimal) */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#1F5EA9] rounded-full flex items-center justify-center text-white">
                                <Heart size={18} fill="currentColor" />
                            </div>
                            <div>
                                <span className="text-xl font-serif font-bold text-[#00204E] tracking-tight block leading-none">Thank Donors</span>
                            </div>
                        </div>

                        {/* Desktop Actions */}
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
                        <div className="flex flex-col gap-3">
                            <button onClick={onLogin} className="w-full py-2 text-slate-600 font-bold border border-slate-200 rounded-xl">Log in</button>
                            <button onClick={onSignup} className="w-full py-2 bg-[#1F5EA9] text-white font-bold rounded-xl shadow-lg shadow-blue-900/20">Connect ActBlue</button>
                        </div>
                    </div>
                )}
            </nav>

            {/* 1. Problem / Agitation Section */}
            <section className="py-20 md:py-32 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-[#00204E] tracking-tighter leading-tight mb-16 max-w-4xl mx-auto">
                        If you're not thanking donors quickly, you're leaving repeat donations on the table.
                    </h1>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Clock size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-3">The "Linear" Donor</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                First-time donors who don't hear from you quick add 70% less likely to give a second time.
                            </p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
                            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FileText size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-3">The CSV List</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Traditional mail houses want minimums and slow turnarounds. Speed is gratitude's currency.
                            </p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
                            <div className="w-12 h-12 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Mail size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-3">Generic Emails</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                "Thank you for your transaction #12345" doesn't build a movement. Physical touch does.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. How It Works Section */}
            <section className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#00204E] tracking-tight mb-4">
                        The only thing you do once: <span className="text-[#1F5EA9]">connect ActBlue.</span>
                    </h2>
                    <p className="text-slate-500 mb-16">We handle the logistics. You handle the winning.</p>

                    <div className="relative max-w-4xl mx-auto">
                        {/* Connector Line */}
                        <div className="hidden md:block absolute top-[2.5rem] left-0 w-full h-0.5 bg-slate-200 -z-10"></div>

                        <div className="grid md:grid-cols-3 gap-12">
                            {/* Step 1 */}
                            <div>
                                <div className="w-20 h-20 bg-white rounded-full border-4 border-slate-50 flex items-center justify-center mx-auto mb-6 shadow-sm z-10 relative">
                                    <span className="text-2xl font-bold text-[#1F5EA9]">1</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Connect</h3>
                                <p className="text-sm text-slate-500">Securely link your ActBlue account via webhook in 30 seconds.</p>
                            </div>

                            {/* Step 2 */}
                            <div>
                                <div className="w-20 h-20 bg-white rounded-full border-4 border-slate-50 flex items-center justify-center mx-auto mb-6 shadow-sm z-10 relative">
                                    <Zap size={28} className="text-purple-500" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Auto-Trigger</h3>
                                <p className="text-sm text-slate-500">Donation comes in? We instantly generate a personalized PDF.</p>
                            </div>

                            {/* Step 3 */}
                            <div>
                                <div className="w-20 h-20 bg-white rounded-full border-4 border-slate-50 flex items-center justify-center mx-auto mb-6 shadow-sm z-10 relative">
                                    <Mail size={28} className="text-green-500" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Mail</h3>
                                <p className="text-sm text-slate-500">We print and mail via USPS First Class within 48 hours.</p>
                            </div>
                        </div>

                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-16">
                            "Literally works while you sleep."
                        </p>
                    </div>
                </div>
            </section>

            {/* 3. Qualifiers Section */}
            <section className="py-24 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Perfect For */}
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <CheckCircle2 className="text-green-600" size={24} />
                                <h3 className="text-xl font-bold text-slate-900">Perfect for campaigns that...</h3>
                            </div>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3 text-sm text-slate-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                                    Use ActBlue as their primary donation processor.
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                                    Raise between $5k - $500k per cycle and lack a huge fulfillment staff.
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                                    Want a real, non-Simulacrum way of touching supporters.
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                                    Values donor retention consistency across digital and physical mail.
                                </li>
                            </ul>
                        </div>

                        {/* Not Fit For */}
                        <div className="bg-red-50/50 rounded-2xl p-8 border border-red-50">
                            <div className="flex items-center gap-2 mb-6">
                                <XCircle className="text-red-500" size={24} />
                                <h3 className="text-xl font-bold text-slate-900">Not a fit if...</h3>
                            </div>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3 text-sm text-slate-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0"></div>
                                    You require 100% "wet handwritten ink" on paper (solus).
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0"></div>
                                    You don't use ActBlue.
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0"></div>
                                    You have more than 3 unpaid interns a month (might be cheaper to do it yourself).
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Brand Assurance Section (Existing - Reused) */}
            <section className="py-24 bg-slate-50 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#00204E] tracking-tight mb-4">
                            Your custom art on the front.<br />Your message on the back.
                        </h2>
                        <p className="text-slate-500">Complete control over your brand, without the fulfillment headache.</p>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-12 items-center">
                        {/* Right Preview Interaction (Swapped to Left visual order if desired, keeping Right for now as per design flow usually alternating) -> Design shows visual below text. Let's keep side-by-side for desktop. */}
                        <div className="lg:col-span-7 order-2 lg:order-1">
                            <div className="bg-white rounded-3xl p-8 border border-slate-200">
                                <div className="bg-slate-200/50 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px]">
                                    <div className="bg-white w-full max-w-md aspect-[6/4] shadow-xl rounded-sm overflow-hidden relative group">
                                        {/* Front Design */}
                                        <div className="w-full h-full bg-[#1e3a8a] text-white p-8 flex flex-col items-center justify-center relative overflow-hidden">
                                            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                                            <h3 className="relative z-10 text-3xl font-serif font-bold leading-tight mb-2 text-center drop-shadow-md">
                                                Thank You<br />For Standing<br />With Us.
                                            </h3>
                                            <div className="absolute bottom-0 left-0 right-0 px-4 py-2 z-20 bg-gradient-to-t from-[#1e3a8a]/80 to-transparent">
                                                <p className="text-[7px] text-white uppercase leading-[1.2] tracking-tight text-center font-medium opacity-90">
                                                    Paid for by Jane for SD.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Left Features (moved to Right col) */}
                        <div className="lg:col-span-5 space-y-6 order-1 lg:order-2">
                            {[
                                {
                                    icon: <ImageIcon size={24} />,
                                    title: "Upload Custom Art",
                                    desc: "High-res support for crisp printing. Use your campaign colors and logo.",
                                    bg: "bg-blue-100",
                                    color: "text-blue-600"
                                },
                                {
                                    icon: <Zap size={24} />,
                                    title: "Smart Variable Data",
                                    desc: "Personalize every card with donor names: \"Dear Sarah\" beats \"Dear Friend\".",
                                    bg: "bg-purple-100",
                                    color: "text-purple-600"
                                },
                                {
                                    icon: <Sparkles size={24} />,
                                    title: "AI Writing Assistant",
                                    desc: "Stuck on what to say? Our vetted AI writes high-conversion copy for you.",
                                    bg: "bg-orange-100",
                                    color: "text-orange-600"
                                },
                                {
                                    icon: <Eye size={24} />,
                                    title: "Live Preview",
                                    desc: "See exactly what donors will hold in their hands before you spend a dime.",
                                    bg: "bg-green-100",
                                    color: "text-green-600"
                                }
                            ].map((feature, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-100">
                                    <div className={`w-10 h-10 rounded-xl ${feature.bg} ${feature.color} flex items-center justify-center flex-shrink-0`}>
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 mb-0.5">{feature.title}</h4>
                                        <p className="text-xs text-slate-500 leading-relaxed">{feature.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Final CTA Section */}
            <section className="py-24 bg-[#1F5EA9] text-white overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-6">
                        Stop letting gratitude slip through the cracks.
                    </h2>
                    <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
                        Join 50+ progressive campaigns boosting retention with automated, high-impact mail.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={onSignup}
                            className="bg-white text-[#1F5EA9] hover:bg-blue-50 px-8 py-4 rounded-full text-base font-bold shadow-xl transition-all hover:scale-[1.05]"
                        >
                            Start mailing thank you's today
                        </button>
                        <a href="#pricing" className="bg-[#164E87] text-white hover:bg-[#0f3863] border border-blue-400 px-8 py-4 rounded-full text-base font-bold shadow-sm transition-all">
                            See pricing
                        </a>
                    </div>
                    <p className="text-xs text-blue-300 mt-6">*No credit card required to setup. Free to connect account.</p>
                </div>
            </section>

            {/* Footer (Minimal) */}
            <footer className="bg-white border-t border-slate-100 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                        <Heart size={12} className="text-[#1F5EA9]" fill="currentColor" />
                        <span className="font-bold text-slate-600">Thank Donors</span>
                        <span>© 2026</span>
                    </div>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-[#1F5EA9] transition-colors">Contact Support</a>
                        <a href="#" className="hover:text-[#1F5EA9] transition-colors">Privacy</a>
                        <a href="#" className="hover:text-[#1F5EA9] transition-colors">Terms</a>
                    </div>
                </div>
            </footer>

        </div>
    );
};

// Simple Icon Components for Visuals
const TrendingUpIcon = ({ size, className }: { size?: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 24}
        height={size || 24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
);

const UploadIcon = ({ size, className }: { size?: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 24}
        height={size || 24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
);

const SparklesIcon = ({ size, className }: { size?: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 24}
        height={size || 24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
    </svg>
);

const ChevronDownIcon = ({ size, className }: { size?: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 24}
        height={size || 24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="m6 9 6 6 6-6"></path>
    </svg>
);

const RotateCcwIcon = ({ size, className }: { size?: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 24}
        height={size || 24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
        <path d="M3 3v5h5"></path>
    </svg>
);

export default LandingPage;
