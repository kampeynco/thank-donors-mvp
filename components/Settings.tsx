import React, { useState, useEffect } from 'react';
import { Profile, ActBlueAccount } from '../types';
import { Webhook, Copy, Check, Home, Save, MapPin, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { useToast } from './ToastContext';
import SettingsLayout from './SettingsLayout';

interface SettingsProps {
    profile: Profile;
    currentAccount: ActBlueAccount | null;
    onUpdate: (profile: Partial<Profile>) => void;
    onDeleteAccount: () => void;
    onSaveAccount: (account: Partial<ActBlueAccount>) => Promise<void>;
}

const Settings: React.FC<SettingsProps> = ({ profile, currentAccount, onUpdate, onDeleteAccount, onSaveAccount }) => {
    const { toast } = useToast();
    const [activeSection, setActiveSection] = useState('general');
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
        { id: 'branding', label: 'Branding', icon: Sparkles },
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
        <div className="max-w-6xl mx-auto">
            <SettingsLayout
                title="Account Settings"
                subtitle="Manage your political committee details and preferences."
                items={menuItems}
                activeItem={activeSection}
                onItemSelect={setActiveSection}
            >
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

                                {currentAccount && currentAccount.id !== 'new' ? (
                                    <div className="border-t border-stone-100 pt-6 mt-6">
                                        <h4 className="font-bold text-stone-800 text-lg mb-2">Disclaimer</h4>
                                        <p className="text-sm text-stone-500 mb-4">Optional small-print text that will appear on your postcards.</p>

                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 mb-2">Disclaimer Text</label>
                                            <textarea
                                                value={disclaimer}
                                                onChange={(e) => setDisclaimer(e.target.value)}
                                                className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none text-sm"
                                                placeholder="e.g., Paid for by Friends of Jane Doe"
                                                rows={3}
                                                disabled={!currentAccount || currentAccount.id === 'new'}
                                            />
                                            <div className="flex gap-2">
                                                <div className="flex-1 bg-stone-50 p-2.5 rounded-lg text-xs font-mono text-stone-600 truncate border border-stone-100 flex justify-between items-center group relative overflow-hidden">
                                                    <span className="absolute inset-0 p-2.5 select-all font-mono">{currentAccount.webhook_password}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(currentAccount.webhook_password, 'password')}
                                                    className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
                                                    title="Copy Password"
                                                >
                                                    {copiedField === 'password' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-6 bg-stone-50 rounded-xl text-stone-500 text-sm">
                                        Please select or create an account to view credentials.
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

                {activeSection === 'branding' && currentAccount && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-stone-100 shadow-sm">
                            <h3 className="font-bold text-stone-800 flex items-center gap-2 mb-6 text-lg">
                                <Sparkles size={20} className="text-violet-500" />
                                Branding Configuration
                            </h3>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 border border-stone-200 rounded-xl bg-stone-50">
                                    <div>
                                        <div className="font-bold text-stone-800">Automated Branding</div>
                                        <div className="text-sm text-stone-500">Automatically apply your logo and colors to postcards (Pro feature)</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={brandingEnabled}
                                            onChange={(e) => setBrandingEnabled(e.target.checked)}
                                            className="sr-only peer"
                                            disabled={!currentAccount || currentAccount.id === 'new'}
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
                                        Save Branding
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
        </div>
    );
};

export default Settings;