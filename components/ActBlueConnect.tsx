import React, { useState, useEffect } from 'react';
import { Copy, ExternalLink, AlertTriangle, ArrowRight, Building, Loader2, MapPin } from 'lucide-react';
import { Profile, ActBlueAccount } from '../types';
import { useToast } from './ToastContext';

interface ActBlueConnectProps {
    profile: Profile;
    currentAccount?: ActBlueAccount | null;
    onUpdateProfile: (profile: Partial<Profile>) => Promise<void>;
    onSaveAccount: (account: Partial<ActBlueAccount>) => Promise<void>;
    onComplete?: () => void;
}

const ActBlueConnect: React.FC<ActBlueConnectProps> = ({
    profile,
    currentAccount,
    onSaveAccount,
    onComplete,
}) => {
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [entityId, setEntityId] = useState('');
    const [committeeName, setCommitteeName] = useState('');
    const [disclaimer, setDisclaimer] = useState('');

    const [streetAddress, setStreetAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zip, setZip] = useState('');

    const [copied, setCopied] = useState(false);

    const isAccountCreated = currentAccount && currentAccount.id !== 'new';

    useEffect(() => {
        if (currentAccount && currentAccount.id !== 'new') {
            setEntityId(currentAccount.entity_id.toString());
            setCommitteeName(currentAccount.committee_name || '');
            setDisclaimer(currentAccount.disclaimer || '');

            if (currentAccount.street_address) setStreetAddress(currentAccount.street_address);
            if (currentAccount.city) setCity(currentAccount.city);
            if (currentAccount.state) setState(currentAccount.state);
            if (currentAccount.postal_code) setZip(currentAccount.postal_code);

            if (step === 1) {
                setStep(3);
            }
        } else {
            setEntityId('');
            setCommitteeName('');
            setDisclaimer('');
            setStreetAddress('');
            setCity('');
            setState('');
            setZip('');

            if (step === 3 && !isAccountCreated) {
                setStep(1);
            }
        }

    }, [currentAccount?.id]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast("Copied to clipboard", "success");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveCampaignDetails = async () => {
        setLoading(true);
        const numericId = parseInt(entityId);
        if (isNaN(numericId)) {
            toast("Entity ID must be a valid number", "error");
            setLoading(false);
            return;
        }

        // Don't save to DB yet, just advance to Step 2
        setStep(2);
        setLoading(false);
    };

    const handleSaveAddress = async () => {
        setLoading(true);
        try {
            // Submit ALL data at once
            const numericId = parseInt(entityId);
            await onSaveAccount({
                entity_id: numericId,
                committee_name: committeeName,
                disclaimer: disclaimer,
                street_address: streetAddress,
                city: city,
                state: state,
                postal_code: zip
            });
            setStep(3);
        } catch (e) {
            // Toast handled in App.tsx
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-serif font-bold text-stone-800">
                    {currentAccount?.id === 'new' ? 'Campaign Setup' : 'Connection Details'}
                </h2>
                <p className="text-stone-500 mt-2">Let's get your campaign set up to send gratitude.</p>
            </div>

            <div className="relative">
                <div className="absolute top-5 left-0 w-full h-1 bg-stone-100 -z-10 rounded-full"></div>
                <div className="flex justify-between w-full max-w-xl mx-auto mb-12">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={`flex flex-col items-center gap-2 ${step >= s ? 'opacity-100' : 'opacity-40'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= s ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-stone-200 text-stone-500'}`}>
                                {s}
                            </div>
                            <span className="text-xs font-medium text-stone-500">
                                {s === 1 ? 'Campaign' : s === 2 ? 'Address' : 'Webhook'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-stone-100 shadow-xl shadow-stone-200/50">

                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex items-start gap-4">
                            <div className="bg-blue-50 p-3 rounded-xl text-blue-500">
                                <Building size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-stone-800">Campaign Details</h3>
                                <p className="text-stone-500 text-sm mt-1">Enter the ActBlue Entity ID for this specific committee.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-stone-700 block mb-1">Committee / Campaign Name</label>
                                <input
                                    type="text"
                                    value={committeeName}
                                    onChange={(e) => setCommitteeName(e.target.value)}
                                    placeholder="e.g. Re-elect Jane Doe"
                                    className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-stone-700 block mb-1">ActBlue Entity ID</label>
                                <input
                                    type="number"
                                    value={entityId}
                                    onChange={(e) => setEntityId(e.target.value)}
                                    placeholder="e.g. 12345"
                                    className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all font-mono"
                                />
                                <p className="text-xs text-stone-400 mt-1">Found in your ActBlue Dashboard URL or settings.</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-stone-700 block mb-1">Postcard Disclaimer</label>
                                <textarea
                                    value={disclaimer}
                                    onChange={(e) => setDisclaimer(e.target.value)}
                                    placeholder="Paid for by..."
                                    rows={2}
                                    className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all resize-none"
                                />
                                <p className="text-xs text-stone-400 mt-1">Required by law on political mailings.</p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={handleSaveCampaignDetails}
                                disabled={entityId.length < 1 || committeeName.length < 2 || loading}
                                className="w-full bg-stone-800 text-white font-bold py-4 rounded-xl hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <>Next: Return Address <ArrowRight size={18} /></>}
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex items-start gap-4">
                            <div className="bg-emerald-50 p-3 rounded-xl text-emerald-500">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-stone-800">Return Address</h3>
                                <p className="text-stone-500 text-sm mt-1">This address will appear on your postcards.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-stone-700 block mb-1">Street Address</label>
                                <input
                                    type="text"
                                    value={streetAddress}
                                    onChange={(e) => setStreetAddress(e.target.value)}
                                    placeholder="e.g. 123 Main St"
                                    className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-stone-700 block mb-1">City</label>
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder="e.g. Washington"
                                    className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-stone-700 block mb-1">State</label>
                                    <input
                                        type="text"
                                        value={state}
                                        onChange={(e) => setState(e.target.value)}
                                        placeholder="e.g. DC"
                                        className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-stone-700 block mb-1">ZIP</label>
                                    <input
                                        type="text"
                                        value={zip}
                                        onChange={(e) => setZip(e.target.value)}
                                        placeholder="e.g. 20001"
                                        className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <button
                                onClick={() => setStep(1)}
                                className="col-span-1 bg-white border border-stone-200 text-stone-600 font-bold py-4 rounded-xl hover:bg-stone-50 transition-all"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSaveAddress}
                                disabled={streetAddress.length < 5 || city.length < 2 || state.length < 2 || zip.length < 5 || loading}
                                className="col-span-2 bg-stone-800 text-white font-bold py-4 rounded-xl hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <>Create Account & Get Webhook <ArrowRight size={18} /></>}
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && currentAccount && isAccountCreated && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex items-start gap-4">
                            <div className="bg-amber-50 p-3 rounded-xl text-amber-500">
                                <ExternalLink size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-stone-800">Connect to ActBlue</h3>
                                <p className="text-stone-500 text-sm mt-1">Copy these credentials into your ActBlue Webhook Settings.</p>
                            </div>
                        </div>

                        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                            <div className="flex items-center gap-3">
                                <code className="flex-1 text-sm font-mono text-stone-600 break-all">{currentAccount.webhook_url}</code>
                                <button
                                    onClick={() => handleCopy(currentAccount.webhook_url)}
                                    className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-stone-200"
                                    title="Copy URL"
                                >
                                    <Copy size={18} className="text-stone-400" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-stone-100 pt-3 mt-2">
                                <div>
                                    <span className="block text-stone-400 uppercase text-[10px] mb-1">Username</span>
                                    <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-stone-100">
                                        <code className="text-xs text-stone-700 truncate flex-1">{currentAccount.webhook_username}</code>
                                        <button onClick={() => handleCopy(currentAccount.webhook_username)} className="text-stone-300 hover:text-stone-500"><Copy size={12} /></button>
                                    </div>
                                </div>
                                <div>
                                    <span className="block text-stone-400 uppercase text-[10px] mb-1">Password</span>
                                    <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-stone-100">
                                        <code className="text-xs text-stone-700 truncate flex-1">{currentAccount.webhook_password}</code>
                                        <button onClick={() => handleCopy(currentAccount.webhook_password)} className="text-stone-300 hover:text-stone-500"><Copy size={12} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl flex gap-3 text-sm text-blue-800">
                            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                            <p>Make sure to select "Donation Created" as the event type in ActBlue.</p>
                        </div>

                        <button
                            onClick={onComplete}
                            className="w-full bg-stone-800 text-white font-bold py-4 rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-stone-200"
                        >
                            Done! Go to Dashboard <ArrowRight size={18} />
                        </button>

                        <div className="text-center">
                            <button onClick={() => setStep(1)} className="text-xs text-stone-400 hover:text-stone-600">Back to Settings</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActBlueConnect;