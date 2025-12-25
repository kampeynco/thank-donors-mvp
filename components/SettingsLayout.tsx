import React from 'react';
import { LucideIcon } from 'lucide-react';



interface SettingsLayoutProps {
    children: React.ReactNode;
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({
    children
}) => {
    return (
        <div className="max-w-5xl mx-auto">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {children}
            </div>
        </div>
    );
};

export default SettingsLayout;
