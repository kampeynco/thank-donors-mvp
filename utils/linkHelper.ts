import { Donation } from '../types';

export const handleViewProof = (
    e: React.MouseEvent,
    donation: Donation,
    toast: (message: string, type?: 'success' | 'error' | 'loading' | 'default') => void
) => {
    e.stopPropagation();
    e.preventDefault();

    if (!donation.lob_url) return;

    const url = donation.lob_url;
    // Fallback to created_at if updated_at is missing, though updated_at is preferred for status changes
    const timestampStr = donation.updated_at || donation.created_at;
    const timestamp = timestampStr ? new Date(timestampStr).getTime() : 0;
    const now = new Date().getTime();
    const timeDiff = now - timestamp;

    // If processed recently (less than 15 seconds) and status indicates it might be new.
    // We use 15 seconds as the safe zone.
    const SAFE_DELAY_MS = 15000;
    const isRecent = timeDiff < SAFE_DELAY_MS && timeDiff >= 0; // Ensure logic works locally

    // If status is 'processed' or 'queued', it's likely just created. 
    // If 'delivered' or 'in_transit', it's old enough even if updated_at is recent (unlikely but possible).
    const isInitialStatus = ['processed', 'queued', 'created'].includes(donation.status);

    if (isRecent && isInitialStatus) {
        const waitTime = Math.max(2000, SAFE_DELAY_MS - timeDiff); // Ensure at least 2s delay if very recent

        toast("Generating postcard proof... opening in a few seconds.", "loading");

        setTimeout(() => {
            window.open(url, '_blank', 'noopener,noreferrer');
        }, waitTime);
    } else {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
};
