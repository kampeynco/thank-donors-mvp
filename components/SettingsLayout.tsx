import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MenuItem {
    id: string;
    label: string;
    icon: LucideIcon;
}

interface SettingsLayoutProps {
    title: string;
    subtitle: string;
    items: MenuItem[];
    activeItem: string;
    onItemSelect: (id: string) => void;
    children: React.ReactNode;
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({
    title,
    subtitle,
    items,
    activeItem,
    onItemSelect,
    children
}) => {
    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-serif font-bold text-stone-800">{title}</h2>
                <p className="text-stone-500 mt-2">{subtitle}</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
                <nav className="w-full md:w-64 flex-shrink-0 space-y-2 sticky top-8">
                    {items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeItem === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onItemSelect(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive
                                        ? 'bg-stone-800 text-white shadow-lg shadow-stone-200'
                                        : 'text-stone-600 hover:bg-stone-100'
                                    }`}
                            >
                                <Icon size={18} className={isActive ? 'text-stone-200' : 'text-stone-400'} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="flex-1 min-w-0 w-full animate-in fade-in slide-in-from-right-4 duration-300">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default SettingsLayout;
