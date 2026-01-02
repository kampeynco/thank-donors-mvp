import React from 'react';
import { Heart } from 'lucide-react';

interface FooterProps {
    onLogin: () => void;
}

const Footer: React.FC<FooterProps> = ({ onLogin }) => {
    return (
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
    );
};

export default Footer;
