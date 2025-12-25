import React, { useState, useEffect } from 'react';
import { Profile, ActBlueAccount } from '../types';
import { Webhook, Copy, Check, Home, Save, MapPin, AlertTriangle, Loader2, Sparkles, FileText, Lock } from 'lucide-react';
import { useToast } from './ToastContext';
import SettingsLayout from './SettingsLayout';

interface SettingsProps {
    profile: Profile;
    currentAccount: ActBlueAccount | null;
    activeSection: string;
    setActiveSection: (section: string) => void;
    onUpdate: (profile: Partial<Profile>) => void;
    onDeleteAccount: () => void;
    onSaveAccount: (account: Partial<ActBlueAccount>) => Promise<void>;
}

const Settings: React.FC<SettingsProps> = ({ profile, currentAccount, activeSection, setActiveSection, onUpdate, onDeleteAccount, onSaveAccount }) => {
    const { toast } = useToast();
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const [committeeName, setCommitteeName] = useState('');

    const [address, setAddress] = useState({
        street_address: '',
        city: '',
        state: '',
        postal_code: ''
    });

    const [disclaimer, setDisclaimer] = useState('');
    const [brandingEnabled, setBrandingEnabled] = useState(true);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (currentAccount && currentAccount.id !== 'new') {
            setCommitteeName(currentAccount.committee_name || '');
            setAddress({
                street_address: currentAccount.street_address || '',
                city: currentAccount.city || '',
                state: currentAccount.state || '',
                postal_code: currentAccount.postal_code || ''
            });
            setDisclaimer(currentAccount.disclaimer || '');
            setBrandingEnabled(currentAccount.entity?.branding_enabled !== false); // Default to true if undefined
        } else {
            setCommitteeName('');
            setAddress({ street_address: '', city: '', state: '', postal_code: '' });
            setDisclaimer('');
            setBrandingEnabled(true);
        }
    }, [currentAccount]);

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        toast("Copied to clipboard", "success");
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAddress({ ...address, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentAccount || currentAccount.id === 'new') {
            toast("Please create an account first.", "error");
            return;
        }

        setIsSaving(true);
        try {
            await onSaveAccount({
                committee_name: committeeName,
                street_address: address.street_address,
                city: address.city,
                state: address.state,
                postal_code: address.postal_code,
                disclaimer: disclaimer,
                branding_enabled: brandingEnabled
            });

            toast('Settings updated successfully!', 'success');
        } catch (e) {
            console.error("Save failed", e);
            // Toast handled in App.tsx generally, but safeguard here
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = () => {
        setIsDeleteModalOpen(true);
        setDeleteConfirmation('');
    };

    const confirmDelete = () => {
        if (deleteConfirmation === 'DELETE') {
            onDeleteAccount();
            setIsDeleteModalOpen(false);
        }
    };

    const menuItems = [
        { id: 'general', label: 'General Information', icon: Home },
        { id: 'webhook', label: 'Webhook Details', icon: Webhook },
        { id: 'branding', label: 'Branding', icon: Sparkles },
        { id: 'disclaimer', label: 'Disclaimer', icon: FileText },
        { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
    ];

    if (!currentAccount) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                <div className="bg-stone-100 p-4 rounded-full mb-4">
                    <Home size={32} className="text-stone-400" />
                </div>
                <h3 className="text-xl font-bold text-stone-700 mb-2">No Account Selected</h3>
                <p className="text-stone-500 max-w-sm">
                    Select an account from the dashboard or create a new one to manage its settings.
                </p>
            </div>
        );
    }

    return (
        <>
            <SettingsLayout>
                {activeSection === 'general' && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-white p-8 rounded-2xl border border-stone-100 shadow-sm">
                            <h3 className="font-bold text-stone-800 flex items-center gap-2 mb-6 text-lg">
                                <Home size={20} className="text-rose-500" />
                                Committee Details
                            </h3>

                            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">Committee Name</label>
                                    <input
                                        name="committee_name"
                                        value={committeeName}
                                        onChange={(e) => setCommitteeName(e.target.value)}
                                        className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                        placeholder="e.g. Friends of Jane Doe"
                                        disabled={!currentAccount || currentAccount.id === 'new'}
                                    />
                                    {(!currentAccount || currentAccount.id === 'new') && (
                                        <p className="text-xs text-amber-600 mt-2">Note: Please create or select an account to save campaign details.</p>
                                    )}
                                </div>

                                <div className="border-t border-stone-100 pt-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <MapPin size={20} className="text-rose-500" />
                                        <h4 className="font-bold text-stone-800 text-lg">Return Address</h4>
                                    </div>
                                    <p className="text-sm text-stone-500 mb-6 -mt-2">This address will appear on your postcards.</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-stone-700 mb-2">Street Address</label>
                                            <input
                                                name="street_address"
                                                value={address.street_address}
                                                onChange={handleAddressChange}
                                                className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                                placeholder="123 Main St"
                                                disabled={!currentAccount || currentAccount.id === 'new'}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 mb-2">City</label>
                                            <input
                                                name="city"
                                                value={address.city}
                                                onChange={handleAddressChange}
                                                className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                                disabled={!currentAccount || currentAccount.id === 'new'}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-stone-700 mb-2">State</label>
                                                <input
                                                    name="state"
                                                    value={address.state}
                                                    onChange={handleAddressChange}
                                                    className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                                    disabled={!currentAccount || currentAccount.id === 'new'}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-stone-700 mb-2">ZIP</label>
                                                <input
                                                    name="postal_code"
                                                    value={address.postal_code}
                                                    onChange={handleAddressChange}
                                                    className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                                    disabled={!currentAccount || currentAccount.id === 'new'}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {(!currentAccount || currentAccount.id === 'new') && (
                                    <div className="text-center py-6 bg-stone-50 rounded-xl text-stone-500 text-sm">
                                        Please select or create an account to view details.
                                    </div>
                                )}

                                <div className="flex justify-end pt-6 border-t border-stone-100 mt-6">
                                    <button
                                        type="submit"
                                        disabled={isSaving || !currentAccount || currentAccount.id === 'new'}
                                        className="flex items-center gap-2 bg-rose-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {activeSection === 'webhook' && currentAccount && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-white p-8 rounded-2xl border border-stone-100 shadow-sm">
                            <h3 className="font-bold text-stone-800 flex items-center gap-2 mb-2 text-lg">
                                <Webhook size={20} className="text-blue-500" />
                                ActBlue Webhook Details
                            </h3>
                            <p className="text-sm text-stone-500 mb-6">Use these credentials to connect your ActBlue account to Thank Donors.</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Webhook URL</label>
                                    <div className="flex gap-2">
                                        <input
                                            readOnly
                                            value={currentAccount?.entity?.webhook_url || currentAccount?.webhook_url || ''}
                                            className="flex-1 p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono text-stone-600"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(currentAccount?.entity?.webhook_url || currentAccount?.webhook_url || '', 'url')}
                                            className="p-3 text-stone-400 hover:text-rose-500 transition-colors"
                                        >
                                            {copiedField === 'url' ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Username</label>
                                        <div className="flex gap-2">
                                            <input
                                                readOnly
                                                value={currentAccount?.entity?.webhook_username || currentAccount?.webhook_username || ''}
                                                className="flex-1 p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono text-stone-600"
                                            />
                                            <button
                                                onClick={() => copyToClipboard(currentAccount?.entity?.webhook_username || currentAccount?.webhook_username || '', 'user')}
                                                className="p-3 text-stone-400 hover:text-rose-500 transition-colors"
                                            >
                                                {copiedField === 'user' ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Password</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="password"
                                                readOnly
                                                value={currentAccount?.entity?.webhook_password || currentAccount?.webhook_password || ''}
                                                className="flex-1 p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono text-stone-600"
                                            />
                                            <button
                                                onClick={() => copyToClipboard(currentAccount?.entity?.webhook_password || currentAccount?.webhook_password || '', 'pass')}
                                                className="p-3 text-stone-400 hover:text-rose-500 transition-colors"
                                            >
                                                {copiedField === 'pass' ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3 text-blue-700 text-sm">
                                <Lock size={20} className="shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold mb-1">Secure Connection</p>
                                    <p>These credentials ensure that only ActBlue can send donation data to your account. Never share these publicly.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'branding' && currentAccount && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-stone-100 shadow-sm">
                            <h3 className="font-bold text-stone-800 flex items-center gap-2 mb-6 text-lg">
                                <Sparkles size={20} className="text-violet-500" />
                                Branding Configuration
                            </h3>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 border border-stone-200 rounded-xl bg-stone-50">
                                    <div className="pr-4">
                                        <div className="font-bold text-stone-800">Remove Thank Donors branding</div>
                                        <div className="text-sm text-stone-500">Hide the Thank Donors badge from the back of your postcards.</div>
                                        {currentAccount?.entity?.tier !== 'pro' && (
                                            <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                <Sparkles size={10} />
                                                Pro Feature
                                            </span>
                                        )}
                                    </div>
                                    <label className={`relative inline-flex items-center ${currentAccount?.entity?.tier === 'pro' ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                                        <input
                                            type="checkbox"
                                            checked={!brandingEnabled}
                                            onChange={(e) => {
                                                if (currentAccount?.entity?.tier === 'pro') {
                                                    setBrandingEnabled(!e.target.checked);
                                                }
                                            }}
                                            className="sr-only peer"
                                            disabled={currentAccount?.entity?.tier !== 'pro' || isSaving}
                                        />
                                        <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    </label>
                                </div>

                                <div className="flex justify-end pt-6 border-t border-stone-100">
                                    <button
                                        type="submit"
                                        disabled={isSaving || !currentAccount || currentAccount.id === 'new'}
                                        className="flex items-center gap-2 bg-rose-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                        Save Preferences
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {activeSection === 'disclaimer' && currentAccount && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-stone-100 shadow-sm">
                            <h3 className="font-bold text-stone-800 flex items-center gap-2 mb-6 text-lg">
                                <FileText size={20} className="text-stone-500" />
                                Legal Disclaimer
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">Disclaimer Text</label>
                                    <p className="text-xs text-stone-500 mb-4 italic">Example: "Paid for by Friends of Jane Doe. Not authorized by any candidate or candidate's committee."</p>
                                    <textarea
                                        value={disclaimer}
                                        onChange={(e) => setDisclaimer(e.target.value)}
                                        className="w-full p-4 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none text-sm leading-relaxed"
                                        placeholder="Enter legacy disclaimer text..."
                                        rows={4}
                                        disabled={!currentAccount || currentAccount.id === 'new'}
                                    />
                                    <p className="text-[11px] text-stone-400 mt-3">
                                        <strong>Note:</strong> This text will appear in small print on the back of every postcard as required by election law.
                                    </p>
                                </div>

                                <div className="flex justify-end pt-6 border-t border-stone-100">
                                    <button
                                        type="submit"
                                        disabled={isSaving || !currentAccount || currentAccount.id === 'new'}
                                        className="flex items-center gap-2 bg-rose-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                        Save Disclaimer
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {activeSection === 'danger' && currentAccount && currentAccount.id !== 'new' && (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-rose-50 p-8 rounded-2xl border border-rose-100">
                            <h3 className="font-bold text-rose-800 flex items-center gap-2 mb-4">
                                <AlertTriangle size={20} />
                                Danger Zone
                            </h3>
                            <p className="text-sm text-rose-600 mb-6">
                                Deleting this campaign <strong>({currentAccount.committee_name})</strong> will remove all associated webhooks and data. This action cannot be undone.
                            </p>
                            <button
                                type="button"
                                onClick={handleDeleteClick}
                                className="bg-white border border-rose-200 text-rose-600 font-bold py-3 px-6 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                            >
                                Delete Campaign
                            </button>
                        </div>
                    </div>
                )}
            </SettingsLayout>

            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 mb-4 mx-auto">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-stone-800 mb-2 text-center">Delete Campaign?</h3>
                        <p className="text-stone-500 mb-4 text-center text-sm">
                            This will permanently delete <strong>{currentAccount?.committee_name}</strong> and all its data.
                        </p>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                                Type "DELETE" to confirm
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                className="w-full p-2 border border-stone-200 rounded-lg text-center font-bold text-rose-600 focus:ring-2 focus:ring-rose-500 outline-none"
                                placeholder="DELETE"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 py-2.5 rounded-xl font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleteConfirmation !== 'DELETE'}
                                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Settings;