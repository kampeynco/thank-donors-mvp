import React, { useEffect } from 'react';
import { useParams, useNavigate, Outlet } from 'react-router-dom';
import { ActBlueAccount } from '../types';
import { Loader2 } from 'lucide-react';

interface AccountLayoutProps {
    accounts: ActBlueAccount[];
    currentAccount: ActBlueAccount | null;
    onSwitchAccount: (account: ActBlueAccount) => void;
    isLoading: boolean;
}

/**
 * AccountLayout
 * 
 * Responsible for:
 * 1. Reading :entityId from the URL.
 * 2. Validating it against the loaded accounts.
 * 3. Setting the `currentAccount` state in the parent App.
 * 4. Redirecting invalid IDs to the default dashboard.
 */
const AccountLayout: React.FC<AccountLayoutProps> = ({
    accounts,
    currentAccount,
    onSwitchAccount,
    isLoading
}) => {
    const { entityId } = useParams<{ entityId: string }>();
    const navigate = useNavigate();

    useEffect(() => {
        // Wait for data to load
        if (isLoading) return;

        // If no accounts exist, the parent App should handle redirection to /pending-entity
        if (accounts.length === 0) return;

        if (!entityId) {
            // Should trigger route-level redirect, but just in case
            return;
        }

        const targetAccount = accounts.find(a => a.id === entityId);

        if (targetAccount) {
            // Sync URL -> State
            if (currentAccount?.id !== targetAccount.id) {
                console.log(`[AccountLayout] Switching to account from URL: ${targetAccount.committee_name} (${targetAccount.id})`);
                onSwitchAccount(targetAccount);
            }
        } else {
            // Invalid Entity ID in URL
            console.warn(`[AccountLayout] Account ID ${entityId} not found in user's accounts. Redirecting.`);
            // Redirect to the first available account's dashboard to "fix" the URL
            if (accounts.length > 0) {
                navigate(`/e/${accounts[0].id}/dashboard`, { replace: true });
            }
        }
    }, [entityId, accounts, isLoading, currentAccount, navigate, onSwitchAccount]);

    if (isLoading) {
        // Show nothing or a spinner while ensuring account context
        return (
            <div className="flex h-screen items-center justify-center bg-stone-50">
                <Loader2 className="animate-spin text-rose-600" size={32} />
            </div>
        );
    }

    return <Outlet />;
};

export default AccountLayout;
