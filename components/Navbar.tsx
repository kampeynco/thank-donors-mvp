import React, { useState } from 'react';
import { Heart, Menu, X } from 'lucide-react';

interface NavbarProps {
    onLogin: () => void;
    onSignup: () => void;
    onPricingClick: () => void;
    onLandingClick: () => void;
    activePage: 'landing' | 'pricing';
}

const Navbar: React.FC<NavbarProps> = ({ onLogin, onSignup, onPricingClick, onLandingClick, activePage }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogoClick = () => {
        if (activePage === 'pricing') {
            onLandingClick();
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleFeatureClick = (id: string) => {
        if (activePage === 'pricing') {
            onLandingClick();
            // Note: In a real app we might want to pass the ID to scroll after navigation
            // For now we just go back to landing
        } else {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }

    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <div className="flex items-center gap-2 cursor-pointer" onClick={handleLogoClick}>
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
                        {activePage === 'landing' ? (
                            <>
                                <a href="#how-it-works" className="hover:text-[#1F5EA9] transition-colors">How it Works</a>
                                <a href="#features" className="hover:text-[#1F5EA9] transition-colors">Features</a>
                            </>
                        ) : (
                            <>
                                <button onClick={() => onLandingClick()} className="hover:text-[#1F5EA9] transition-colors">How it Works</button>
                                <button onClick={() => onLandingClick()} className="hover:text-[#1F5EA9] transition-colors">Features</button>
                            </>
                        )}

                        <button
                            onClick={activePage === 'pricing' ? undefined : onPricingClick}
                            className={`transition-colors ${activePage === 'pricing' ? 'text-[#1F5EA9] font-bold' : 'hover:text-[#1F5EA9]'}`}
                        >
                            Pricing
                        </button>

                        {activePage === 'landing' ? (
                            <a href="#faq" className="hover:text-[#1F5EA9] transition-colors">FAQ</a>
                        ) : (
                            <button onClick={() => onLandingClick()} className="hover:text-[#1F5EA9] transition-colors">FAQ</button>
                        )}
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
                    {activePage === 'landing' ? (
                        <>
                            <a href="#how-it-works" className="block text-slate-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>How it Works</a>
                            <a href="#features" className="block text-slate-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
                        </>
                    ) : (
                        <>
                            <button onClick={() => { setIsMobileMenuOpen(false); onLandingClick(); }} className="block text-slate-600 font-medium w-full text-left">How it Works</button>
                            <button onClick={() => { setIsMobileMenuOpen(false); onLandingClick(); }} className="block text-slate-600 font-medium w-full text-left">Features</button>
                        </>
                    )}

                    <button
                        onClick={() => { setIsMobileMenuOpen(false); if (activePage !== 'pricing') onPricingClick(); }}
                        className={`block font-medium w-full text-left ${activePage === 'pricing' ? 'text-[#1F5EA9] font-bold' : 'text-slate-600'}`}
                    >
                        Pricing
                    </button>

                    {activePage === 'landing' ? (
                        <a href="#faq" className="block text-slate-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>FAQ</a>
                    ) : (
                        <button onClick={() => { setIsMobileMenuOpen(false); onLandingClick(); }} className="block text-slate-600 font-medium w-full text-left">FAQ</button>
                    )}

                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                        <button onClick={onLogin} className="w-full py-2 text-slate-600 font-bold border border-slate-200 rounded-xl">Log in</button>
                        <button onClick={onSignup} className="w-full py-2 bg-[#1F5EA9] text-white font-bold rounded-xl shadow-lg shadow-blue-900/20">Connect ActBlue</button>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
