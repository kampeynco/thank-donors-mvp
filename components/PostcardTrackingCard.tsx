import React from 'react';
import { Donation, ViewState } from '../types';
import {
    CheckCircle2,
    Truck,
    Mail,
    AlertCircle,
    ExternalLink,
    X,
    MapPin,
    RotateCcw,
    Loader2,
    Calendar,
    CreditCard,
    Palette
} from 'lucide-react';
import { useToast } from './ToastContext';
import { handleViewProof } from '../utils/linkHelper';

interface PostcardTrackingCardProps {
    donation: Donation;
    onClose: () => void;
    onRetry?: () => void;
    onUpdateAddress?: () => void;
    onNavigate?: (view: ViewState, section?: string) => void;
    isRetrying?: boolean;
}


const PostcardTrackingCard: React.FC<PostcardTrackingCardProps> = ({ donation, onClose, onRetry, onUpdateAddress, onNavigate, isRetrying }) => {
    const { toast } = useToast();
    const events = donation.events || [];

    // Sort events by date descending (most recent first)
    const sortedEvents = [...events].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'processed':
            case 'created':
                return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'in_transit':
                return <Truck className="w-5 h-5 text-blue-500" />;
            case 'delivered':
                return <Mail className="w-5 h-5 text-indigo-500" />;
            case 'failed':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Calendar className="w-5 h-5 text-gray-500" />;
        }
    };

    const formatStatus = (status: string) => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const isBalanceError =
        donation.status === 'failed' &&
        (donation.error_message?.toLowerCase().includes('balance') ||
            donation.error_message?.toLowerCase().includes('funds') ||
            donation.error_message?.toLowerCase().includes('credit'));

    const isAddressError =
        donation.status === 'failed' &&
        (donation.error_message?.toLowerCase().includes('address') ||
            donation.error_message?.toLowerCase().includes('zip') ||
            donation.error_message?.toLowerCase().includes('incomplete'));

    const isDesignError =
        donation.status === 'failed' &&
        (!donation.front_image_url || !donation.back_message);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                    <h3 className="font-semibold text-gray-900">Postcard Tracking</h3>
                    <p className="text-[10px] font-mono text-gray-400 mt-0.5">ID: {donation.lob_postcard_id || 'Generating...'}</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-gray-200 rounded-full transition-colors text-gray-400"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Donor Info Header */}
                <div className="flex items-start gap-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                        <MapPin className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-indigo-900">
                            {donation.donor_firstname} {donation.donor_lastname}
                        </div>
                        <div className="text-xs text-indigo-700 leading-relaxed mt-1">
                            {donation.address_street}<br />
                            {donation.address_city}, {donation.address_state} {donation.address_zip}
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="relative pl-6 space-y-8 pr-2">
                    {/* Vertical line */}
                    <div className="absolute left-[11px] top-2 bottom-6 w-0.5 bg-gray-100" />

                    {sortedEvents.length > 0 ? (
                        sortedEvents.map((event) => (
                            <div key={event.id} className="relative flex items-start gap-4">
                                <div className="absolute -left-[23px] bg-white p-1">
                                    {getStatusIcon(event.status)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-semibold text-gray-900">
                                            {formatStatus(event.status)}
                                        </span>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                            {new Date(event.created_at).toLocaleString([], {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                        {event.description}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Calendar className="w-8 h-8 text-gray-200 mb-2" />
                            <p className="text-sm text-gray-400 italic">
                                Waiting for tracking updates...
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {['failed', 'returned_to_sender'].includes(donation.status) && (onRetry || onUpdateAddress || onNavigate) && (
                <div className="p-4 bg-rose-50 border-t border-rose-100 mt-auto">
                    <div className="flex flex-col gap-3">
                        {isBalanceError && onNavigate ? (
                            <button
                                onClick={() => onNavigate(ViewState.SETTINGS, 'billing')}
                                className="text-sm font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center justify-center gap-2 py-1"
                            >
                                <CreditCard className="w-4 h-4" />
                                <span>Add Balance</span>
                            </button>
                        ) : isAddressError && onUpdateAddress ? (
                            <button
                                onClick={onUpdateAddress}
                                className="text-sm font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center justify-center gap-2 py-1"
                            >
                                <MapPin className="w-4 h-4" />
                                <span>Update Address</span>
                            </button>
                        ) : isDesignError && onNavigate ? (
                            <button
                                onClick={() => onNavigate(ViewState.POSTCARD_BUILDER)}
                                className="text-sm font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center justify-center gap-2 py-1"
                            >
                                <Palette className="w-4 h-4" />
                                <span>Design Postcard</span>
                            </button>
                        ) : (
                            <button
                                onClick={onRetry}
                                disabled={isRetrying}
                                className="text-sm font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center justify-center gap-2 py-1 disabled:opacity-50"
                            >
                                {isRetrying ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <RotateCcw className="w-4 h-4" />
                                )}
                                <span>Retry Sending Postcard</span>
                            </button>
                        )}
                        <p className="text-[10px] text-rose-500 text-center italic">
                            This will re-deduct balance and attempt to resend the postcard.
                        </p>
                    </div>
                </div>
            )}

            {donation.lob_url && (
                <div className="p-4 bg-gray-50 border-t border-gray-100 mt-auto">

                    <a
                        href={donation.lob_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => handleViewProof(e, donation, toast)}
                        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-[0.98]"
                    >
                        <span>View Live Proof</span>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                    </a>
                </div>
            )}
        </div>
    );
};

export default PostcardTrackingCard;
