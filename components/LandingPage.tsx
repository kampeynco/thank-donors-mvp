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
    Lock,
    XCircle,
    RotateCcw
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

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">

                        {/* Left Content */}
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-blue-100 text-[#1F5EA9] text-xs font-bold uppercase tracking-wide mb-6">
                                <span className="w-2 h-2 rounded-full bg-[#1F5EA9] animate-pulse"></span>
                                Powered by ActBlue
                            </div>

                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-[#00204E] tracking-tighter leading-[1.1] mb-6">
                                Thank Your Donors <span className="text-[#1F5EA9]">Automagically.</span>
                            </h1>

                            <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-lg">
                                Every ActBlue donation triggers a campaign-branded postcard—printed and mailed for you. High-touch gratitude, zero extra effort.
                            </p>

                            <div className="space-y-3 mb-8">
                                {[
                                    "Integrates with ActBlue in seconds",
                                    "Real pen-plotted handwritten style",
                                    "Automated tracking & reporting"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle2 size={12} className="text-green-600" />
                                        </div>
                                        <span className="text-[#00204E] tracking-tight">{item}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                <button
                                    onClick={onSignup}
                                    className="inline-flex items-center justify-center gap-2 bg-[#1F5EA9] hover:bg-[#164E87] text-white px-8 py-4 rounded-full text-base font-bold shadow-xl shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Webhook size={20} />
                                    Connect ActBlue
                                </button>
                                <button className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-4 rounded-full text-base font-bold shadow-sm transition-all hover:border-slate-300">
                                    <Mail size={20} />
                                    See a Sample Card
                                </button>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <ShieldCheck size={16} className="text-[#1F5EA9]" />
                                <span>Trusted by 50+ progressive campaigns</span>
                            </div>
                        </div>

                        {/* Right Visual - Dashboard Mockup */}
                        <div className="relative z-10">
                            <div className="absolute top-0 right-0 w-[150%] h-[150%] bg-gradient-to-br from-blue-100/50 via-slate-100 to-white rounded-full blur-3xl -z-10 translate-x-1/4 -translate-y-1/4"></div>

                            <div className="bg-white rounded-3xl p-6 shadow-2xl shadow-blue-900/40 border border-slate-100 relative scale-105">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-2xl font-serif font-bold text-[#00204E] tracking-tight">Overview</h3>
                                        <p className="text-slate-500 text-sm">Your gratitude efforts at a glance.</p>
                                    </div>
                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                        Status: Active
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all cursor-default group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Postcards Sent</span>
                                            <Mail className="text-slate-300 group-hover:text-[#1F5EA9] transition-colors" size={20} />
                                        </div>
                                        <div className="text-3xl font-bold text-slate-900 mb-1">1,248</div>
                                        <div className="text-xs font-bold text-green-600 flex items-center gap-1">
                                            <Activity size={12} />
                                            +12% this week
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all cursor-default group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">In Queue</span>
                                            <Clock className="text-slate-300 group-hover:text-amber-500 transition-colors" size={20} />
                                        </div>
                                        <div className="text-3xl font-bold text-slate-900 mb-1">42</div>
                                        <div className="text-xs font-medium text-slate-500">Processing now...</div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Recent Activity</div>

                                    {/* Activity Item 1 */}
                                    <div className="flex items-center gap-4 p-3 rounded-xl bg-white border border-slate-100 hover:border-blue-200 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">JD</div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-slate-900">Jane Doe</div>
                                            <div className="text-xs text-slate-500">Donated $50</div>
                                        </div>
                                        <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-100">Card Sent</span>
                                    </div>

                                    {/* Activity Item 2 */}
                                    <div className="flex items-center gap-4 p-3 rounded-xl bg-white border border-slate-100 hover:border-blue-200 transition-colors relative">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">MS</div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-slate-900">Mark Smith</div>
                                            <div className="text-xs text-slate-500">Donated $25</div>
                                        </div>

                                        {/* Retention Popover */}
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-xl shadow-xl shadow-slate-200 p-3 border border-slate-100 flex items-center gap-3 animate-bounce-subtle">
                                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                                <TrendingUpIcon size={16} className="text-green-600" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase font-bold text-slate-400">Retention Boost</div>
                                                <div className="text-sm font-bold text-slate-900">+24% Increase</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
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
                                    title: "Upload Campaign Logos",
                                    desc: "High-res support for crisp printing.",
                                    bg: "bg-blue-100",
                                    color: "text-blue-600"
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

                                                {/* Logo Area */}
                                                <div className="relative z-10 w-16 h-16 border-2 border-white rounded-full flex items-center justify-center mb-6">
                                                    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-b-[14px] border-b-white border-r-[8px] border-r-transparent"></div>
                                                </div>

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

            {/* Features Grid ("Scalable Gratitude") */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <div className="inline-block px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold uppercase tracking-widest mb-4">Platform Capabilities</div>
                        <h2 className="text-4xl md:text-6xl font-serif font-bold text-[#00204E] tracking-tight mb-6">Everything you need to make <span className="text-[#1F5EA9] italic">gratitude scalable.</span></h2>
                        <p className="text-xl text-slate-600">Stop manually handwriting cards. Turn ActBlue donations into personalized physical postcards automatically, without losing the personal touch.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                        {/* Feature 1: AI Writing */}
                        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-200/40 border border-slate-100">
                            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                                <SparklesIcon size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">AI-powered writing</h3>
                            <p className="text-slate-600 mb-8 leading-relaxed">Never stare at a blank page again. Our model analyzes donor history and contribution amounts to draft heartfelt, unique messages that sound just like you wrote them yourself.</p>

                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">J</div>
                                    <div className="flex-1">
                                        <div className="h-2 w-24 bg-slate-200 rounded-full mb-3"></div>
                                        <p className="font-handwriting text-lg text-slate-800 leading-relaxed mb-4">
                                            "Dear Sarah, thank you so much for your generous donation of <span className="bg-green-100 text-green-700 px-1 rounded">$50</span>! Your support helps us keep fighting for clean water in our district. We couldn't do this without you."
                                        </p>
                                        <div className="flex gap-2">
                                            <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] text-slate-500 font-medium">Warm Tone</span>
                                            <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] text-slate-500 font-medium">Under 200 chars</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feature 2: Analytics */}
                        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-200/40 border border-slate-100">
                            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                                <Activity size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">Real-time analytics</h3>
                            <p className="text-slate-600 mb-8 leading-relaxed">Track every dollar raised from your gratitude campaigns. See delivery statuses and ROI instantly.</p>

                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 relative overflow-hidden mt-auto">
                                <div className="mb-6">
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Raised</div>
                                    <div className="flex items-end gap-3">
                                        <div className="text-3xl font-bold text-slate-900">$12,450</div>
                                        <div className="text-sm font-bold text-green-600 mb-1">+12%</div>
                                    </div>
                                </div>
                                <div className="flex items-end gap-2 h-24">
                                    <div className="w-1/5 bg-blue-100 rounded-t-lg h-[40%]"></div>
                                    <div className="w-1/5 bg-blue-100 rounded-t-lg h-[60%]"></div>
                                    <div className="w-1/5 bg-blue-100 rounded-t-lg h-[50%]"></div>
                                    <div className="w-1/5 bg-blue-100 rounded-t-lg h-[75%]"></div>
                                    <div className="w-1/5 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg h-[90%] shadow-lg shadow-blue-500/30"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Feature 3: Automation */}
                        <div className="bg-white rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm border border-slate-100">
                            <div className="flex-1">
                                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4">
                                    <Zap size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Instant trigger automation</h3>
                                <p className="text-sm text-slate-600 leading-relaxed">Connect ActBlue once. We listen for new donations and queue postcards instantly. No CSV exports, no manual uploads. It just works.</p>
                            </div>
                            <div className="flex items-center gap-3 opacity-90">
                                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold shadow-lg shadow-blue-500/30">ActBlue</div>
                                <div className="h-0.5 w-12 bg-slate-200 relative">
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-300 rounded-full"></div>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-[#1F5EA9] flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                                    <Mail size={16} />
                                </div>
                            </div>
                        </div>

                        {/* Feature 4: Re-engagement */}
                        <div className="bg-white rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm border border-slate-100">
                            <div className="flex-1">
                                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                                    <QrCode size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Smart re-engagement</h3>
                                <p className="text-sm text-slate-600 leading-relaxed">Turn one-time donors into recurring supporters. Add dynamic QR codes to your postcards that link directly to a pre-filled donation page.</p>
                            </div>
                            <div className="relative">
                                <div className="w-24 h-32 bg-slate-800 rounded-lg p-3 flex flex-col items-center justify-center shadow-xl">
                                    <div className="w-12 h-12 bg-white rounded flex items-center justify-center mb-2">
                                        <QrCode size={28} className="text-slate-900" />
                                    </div>
                                    <div className="w-10 h-1 bg-slate-600 rounded-full"></div>
                                </div>
                                <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-20">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Trusted By Campaigns Using</p>
                    <div className="flex flex-wrap justify-center gap-12 items-center opacity-40 grayscale">
                        <div className="flex items-center gap-2 text-xl font-bold text-slate-600"><span className="w-6 h-6 rounded-full bg-slate-400"></span> ActBlue</div>
                        <div className="flex items-center gap-2 text-xl font-bold text-slate-600"><span className="w-6 h-6 rounded-full bg-slate-400"></span> NGP VAN</div>
                        <div className="flex items-center gap-2 text-xl font-bold text-slate-600"><span className="w-6 h-6 rounded-full bg-slate-400"></span> ActionNetwork</div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#00204E] tracking-tight mb-6">Frequently Asked Questions</h2>
                        <p className="text-lg text-slate-600 mb-8">Everything you need to know about automated gratitude, sending postcards, and managing your donor relationships.</p>

                        <div className="relative max-w-lg mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input type="text" placeholder="Search for answers..." className="w-full pl-12 pr-4 py-4 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-[#1F5EA9] transition-all shadow-sm" />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            {
                                question: "How fast are postcards sent after a donation?",
                                answer: "Once a donation is processed via ActBlue, our system queues the postcard immediately. Printing and mailing typically happen within 24-48 hours. Depending on the destination, delivery usually takes 3-5 business days via USPS First Class Mail.",
                                icon: <Clock size={20} />, text: "text-blue-600", bg: "bg-blue-50"
                            },
                            {
                                question: "Can I approve messages before they are sent?",
                                answer: "Yes! You can enable \"Manual Approval Mode\" in your settings. This holds all postcards in a \"Pending\" state until you review and approve them individually or in bulk. By default, smaller donations are often set to auto-send for efficiency.",
                                icon: <ShieldCheck size={20} />, text: "text-green-600", bg: "bg-green-50"
                            },
                            {
                                question: "Is the branding customizable?",
                                answer: "Absolutely. You can upload your own campaign logo, choose your brand colors, and even upload custom background imagery for the front of the postcard. The \"Design\" tab allows for full previewing before you go live.",
                                icon: <Palette size={20} />, text: "text-purple-600", bg: "bg-purple-50"
                            },
                            {
                                question: "Can I set different messages for different donor levels?",
                                answer: "Yes. You can create tiered rules. For example, send a standard \"Thank You\" to donors under $50, and a more detailed, premium card to donors giving over $100. You configure these triggers in the automation settings.",
                                icon: <BarChart3 size={20} />, text: "text-amber-600", bg: "bg-amber-50"
                            },
                            {
                                question: "How does the ActBlue integration work?",
                                answer: "We use a secure webhook integration. Once you provide your ActBlue webhook credentials in the \"Settings\" tab, we automatically receive donation data in real-time. No manual CSV uploads are required.",
                                icon: <Webhook size={20} />, text: "text-indigo-600", bg: "bg-indigo-50"
                            },
                            {
                                question: "How secure is my donor data?",
                                answer: "Security is our priority. We are SOC-2 compliant and use end-to-end encryption for all donor data. We never sell your donor lists and data is only used for the purpose of fulfilling your postcard orders.",
                                icon: <Lock size={20} />, text: "text-red-600", bg: "bg-red-50"
                            },
                            {
                                question: "What are the fees per postcard?",
                                answer: "Pricing is all-inclusive (printing, postage, and platform fee). Rates start at $0.79 per card for standard volume. Bulk discounts are available for campaigns sending over 5,000 cards per month.",
                                icon: <DollarSign size={20} />, text: "text-emerald-600", bg: "bg-emerald-50"
                            },
                            {
                                question: "What happens if a postcard fails to deliver?",
                                answer: "If an address is invalid, our system flags it before printing to save you money. These appear in your \"Failed\" queue. If USPS returns a card, we update the status in your dashboard so you can update your records.",
                                icon: <AlertTriangle size={20} />, text: "text-orange-600", bg: "bg-orange-50"
                            }
                        ].map((faq, i) => (
                            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-8 hover:shadow-lg transition-all hover:border-blue-100 group">
                                <div className="flex gap-4 items-start">
                                    <div className={`w-10 h-10 ${faq.bg} ${faq.text} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                        {faq.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-3">{faq.question}</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed">{faq.answer}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
                        <h3 className="text-2xl font-serif font-bold text-[#00204E] tracking-tight mb-2">Still have questions?</h3>
                        <p className="text-slate-500 mb-8">Can't find the answer you're looking for? Our support team is here to help.</p>
                        <div className="flex justify-center gap-4">
                            <button className="bg-[#1F5EA9] hover:bg-[#1F5EA9] text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2">
                                <MessageSquare size={18} /> Contact Support
                            </button>
                            <button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2">
                                <FileText size={18} /> Documentation
                            </button>
                        </div>
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
                        <button onClick={onLogin} className="hover:text-[#1F5EA9] transition-colors">Login</button>
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
