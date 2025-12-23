import React, { useState } from 'react';

interface TooltipProps {
    content: string | undefined;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

const StatusTooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
    const [isVisible, setIsVisible] = useState(false);

    if (!content) return <>{children}</>;

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    const arrowClasses = {
        top: 'top-full left-1/2 -translate-x-1/2 -mt-1 border-t-stone-800',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-stone-800',
        left: 'left-full top-1/2 -translate-y-1/2 -ml-1 border-l-stone-800',
        right: 'right-full top-1/2 -translate-y-1/2 -mr-1 border-r-stone-800',
    };

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className={`absolute z-[100] w-max max-w-xs px-3 py-2 text-sm font-medium text-white bg-stone-800 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200 ${positionClasses[position]}`}>
                    {content}
                    <div className={`absolute border-4 border-transparent ${arrowClasses[position]}`}></div>
                </div>
            )}
        </div>
    );
};

export default StatusTooltip;
