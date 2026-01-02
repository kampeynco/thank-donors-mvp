import React, { useState } from 'react';
import {
    Heart,
    CheckCircle2,
    ArrowRight,
    Clock,
    Image as ImageIcon,
    Eye,
    Zap,
    Sparkles,
    Mail,
    Menu,
    X,
    AlertTriangle,
    XCircle,
    RotateCcw as RotateCcwIcon
} from 'lucide-react';

interface LandingPageProps {
    onLogin: () => void;
    onSignup: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onSignup }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-[#00204E]">

            {/* Navigation */}
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
                                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">Automated Gratitude</span>
                            </div>
                        </div>

                        {/* Desktop Links */}
                        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                            <a href="#how-it-works" className="hover:text-[#1F5EA9] transition-colors">How it Works</a>
                            <a href="#features" className="hover:text-[#1F5EA9] transition-colors">Features</a>
                            <a href="#pricing" className="hover:text-[#1F5EA9] transition-colors">Pricing</a>
                            <a href="#faq" className="hover:text-[#1F5EA9] transition-colors">FAQ</a>
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
                        <a href="#how-it-works" className="block text-slate-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>How it Works</a>
                        <a href="#features" className="block text-slate-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
                        <a href="#pricing" className="block text-slate-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
                        <a href="#faq" className="block text-slate-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>FAQ</a>
                        <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                            <button onClick={onLogin} className="w-full py-2 text-slate-600 font-bold border border-slate-200 rounded-xl">Log in</button>
                            <button onClick={onSignup} className="w-full py-2 bg-[#1F5EA9] text-white font-bold rounded-xl shadow-lg shadow-blue-900/20">Connect ActBlue</button>
                        </div>
                    </div>
                )}
            </nav>

            {/* Problem / Agitation Section */}
            <section className="py-24 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-block px-3 py-1 bg-rose-50 border border-rose-100 text-rose-600 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                            The Problem
                        </div>
                        <h1 className="text-4xl md:text-6xl font-serif font-bold text-[#00204E] tracking-tight leading-tight mb-6">
                            If you're not thanking donors <span className="text-rose-600 italic">quickly</span>, you're leaving repeat donations on the table.
                        </h1>
                        <p className="text-xl text-slate-600 leading-relaxed">
                            The first 48 hours after a donation are critical. Yet most campaigns rely on slow manual processes or generic emails that get ignored.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-rose-600 mb-6">
                                <Clock size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Manual is too slow</h3>
                            <p className="text-slate-600">
                                handwriting 500 cards takes weeks. By the time they arrive, the donor has forgotten why they gave.
                            </p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-rose-600 mb-6">
                                <Mail size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Email is ignored</h3>
                            <p className="text-slate-600">
                                Generic "Thank You" emails have a 20% open rate. Your gratitude is landing in spam folders.
                            </p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-rose-600 mb-6">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Volunteers flake</h3>
                            <p className="text-slate-600">
                                Managing postcard parties is a logistical nightmare. Consistency is impossible to maintain.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-24 bg-[#00204E] text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-3xl md:text-5xl font-serif font-bold tracking-tight mb-6">
                            The only thing you do once:<br /> connect ActBlue.
                        </h2>
                        <p className="text-blue-200 text-lg">
                            We automate the entire physical gratitude loop so you can focus on winning.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-blue-800/50 -z-10"></div>

                        <div className="relative">
                            <div className="w-24 h-24 bg-[#1F5EA9] rounded-2xl border-4 border-[#00204E] flex items-center justify-center text-3xl font-bold mb-8 mx-auto shadow-xl shadow-blue-900/50">1</div>
                            <h3 className="text-xl font-bold mb-4 text-center">Connect</h3>
                            <p className="text-blue-200 text-center leading-relaxed">
                                Link your ActBlue account in one click. We instantly sync with your donation data securely.
                            </p>
                        </div>
                        <div className="relative">
                            <div className="w-24 h-24 bg-[#1F5EA9] rounded-2xl border-4 border-[#00204E] flex items-center justify-center text-3xl font-bold mb-8 mx-auto shadow-xl shadow-blue-900/50">2</div>
                            <h3 className="text-xl font-bold mb-4 text-center">Customize</h3>
                            <p className="text-blue-200 text-center leading-relaxed">
                                Upload your branding and set rules (e.g. "Send $50+ donors the Gold Card").
                            </p>
                        </div>
                        <div className="relative">
                            <div className="w-24 h-24 bg-[#1F5EA9] rounded-2xl border-4 border-[#00204E] flex items-center justify-center text-3xl font-bold mb-8 mx-auto shadow-xl shadow-blue-900/50">3</div>
                            <h3 className="text-xl font-bold mb-4 text-center">Auto-Send</h3>
                            <p className="text-blue-200 text-center leading-relaxed">
                                We print and mail personalized postcards within 48 hours of every donation.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Qualifiers Section */}
            <section className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                        <div className="grid md:grid-cols-2">
                            {/* Fit */}
                            <div className="p-12 border-b md:border-b-0 md:border-r border-slate-100 bg-green-50/30">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900">This is for you if...</h3>
                                </div>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                                        <span className="text-slate-700 font-medium">You use ActBlue for fundraising</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                                        <span className="text-slate-700 font-medium">You want to increase donor retention</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                                        <span className="text-slate-700 font-medium">You value high-quality, physical touchpoints</span>
                                    </li>
                                </ul>
                            </div>

                            {/* No Fit */}
                            <div className="p-12 bg-red-50/30">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                        <XCircle size={24} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900">This is NOT for you if...</h3>
                                </div>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                                        <span className="text-slate-700 font-medium">You want generic bulk mailers</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                                        <span className="text-slate-700 font-medium">You don't care about repeat donations</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                                        <span className="text-slate-700 font-medium">You enjoy licking stamps for hours</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Brand Assurance Section */}
            <section className="py-24 bg-slate-50 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-16">
                        <div className="text-[#1F5EA9] text-sm font-bold uppercase tracking-widest mb-2">Brand Assurance</div>
                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#00204E] tracking-tight mb-6">It looks like you—<br />because it is you.</h2>
                        <p className="text-lg text-slate-600 max-w-2xl">Authenticity drives engagement. Our platform ensures every piece of gratitude sent to your donors feels like it came directly from your campaign HQ. No generic templates—just your brand, front and center.</p>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-12 items-center">
                        {/* Left Features */}
                        <div className="lg:col-span-5 space-y-8">
                            {[
                                {
                                    icon: <ImageIcon size={24} />,
                                    title: "Upload Custom Art",
                                    desc: "High-res support for crisp printing.",
                                    bg: "bg-blue-100",
                                    color: "text-blue-600"
                                },
                                {
                                    icon: <Zap size={24} />,
                                    title: "Smart Variable Data",
                                    desc: "Personalize every card with donor names.",
                                    bg: "bg-purple-100",
                                    color: "text-purple-600"
                                },
                                {
                                    icon: <Sparkles size={24} />,
                                    title: "AI Writing Assistant",
                                    desc: "Draft perfect messages in seconds.",
                                    bg: "bg-orange-100",
                                    color: "text-orange-600"
                                },
                                {
                                    icon: <Eye size={24} />,
                                    title: "Live Preview",
                                    desc: "See exactly what donors will hold in their hands.",
                                    bg: "bg-blue-100",
                                    color: "text-[#1F5EA9]"
                                }
                            ].map((feature, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className={`w-12 h-12 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center flex-shrink-0`}>
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-900 mb-1">{feature.title}</h4>
                                        <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                                    </div>
                                </div>
                            ))}

                            <div className="pt-4">
                                <button onClick={onSignup} className="bg-[#00204E] hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2">
                                    Open Brand Settings <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Right Preview Interaction */}
                        <div className="lg:col-span-7">
                            <div className="bg-white rounded-3xl p-8 border border-slate-200">
                                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Preview Mode</span>
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-[#1F5EA9]"></div>
                                            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                        </div>
                                    </div>
                                    <div className="text-xs font-medium text-slate-400 flex items-center gap-2">
                                        <RotateCcwIcon size={12} /> Autosaved
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Controls */}


                                    {/* Canvas Area */}
                                    <div className="flex-1 bg-slate-200/50 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px]">
                                        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <Eye size={12} />
                                            Live Front Preview
                                        </div>
                                        {/* Postcard Mockup - Front Only (Synced with Builder) */}
                                        <div className="bg-white w-full max-w-md aspect-[6/4] shadow-xl rounded-sm overflow-hidden relative group">
                                            {/* Front Design (Democratic Blue Theme) */}
                                            <div className="w-full h-full bg-[#1e3a8a] text-white p-8 flex flex-col items-center justify-center relative overflow-hidden">
                                                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>



                                                {/* Main Heading */}
                                                <h3 className="relative z-10 text-3xl font-serif font-bold leading-tight mb-2 text-center drop-shadow-md">
                                                    Thank You<br />For Standing<br />With Us.
                                                </h3>

                                                {/* Committee Disclaimer (Builder Implementation) */}
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
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-16 border-t border-slate-200">
                        {[
                            { label: "Seamless Integration", value: "ActBlue" },
                            { label: "Turnaround Time", value: "48hr" },
                            { label: "Recycled Paper", value: "100%" },
                            { label: "First Class Mail", value: "USPS" },
                        ].map((stat, i) => (
                            <div key={i} className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
                                <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                                <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>



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

            {/* Minimal Footer */}
            <footer className="bg-[#00204E] border-t border-blue-900/50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-blue-400/60">
                    <div>© 2026 Thank Donors Inc. All rights reserved.</div>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Support</a>
                    </div>
                </div>
            </footer>

        </div>
    );
};

// Simple Icon Components for Visuals


export default LandingPage;
