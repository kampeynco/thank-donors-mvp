import React, { useState, useEffect } from 'react';
import { Copy, ExternalLink, AlertTriangle, ArrowRight, Building, Loader2, MapPin, Palette, Image as ImageIcon, Sparkles, Upload, Check, MessageSquare, X, Eye } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { Profile, ActBlueAccount } from '../types';
import { useToast } from './ToastContext';

const DEMO_DONOR = {
    firstname: 'Alex',
    lastname: 'Donor',
    addr1: '123 Democracy Ln',
    addr2: '',
    city: 'Washington',
    state: 'DC',
    zip: '20001',
    amount: '50',
    date: new Date().toLocaleDateString()
};

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

    // Step 3 & 4 State (Design)
    const [frontImage, setFrontImage] = useState<string | null>(null);
    const [backMessage, setBackMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

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

            // design
            if (currentAccount.front_image_url) setFrontImage(currentAccount.front_image_url);
            if (currentAccount.back_message) setBackMessage(currentAccount.back_message);

            // If account is fully created (has ID), jump to connected state or final step
            if (step === 1) {
                setStep(5);
            }
        } else {
            setEntityId('');
            setCommitteeName('');
            setDisclaimer('');
            setStreetAddress('');
            setCity('');
            setState('');
            setZip('');
            setFrontImage(null);
            setBackMessage('');

            if (step === 5 && !isAccountCreated) {
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
        // Advance to Step 3 (Design) - we save everything after design is confirmed
        setStep(3);
        setLoading(false);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setIsUploading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `uploads/${profile.id}/${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = await supabase.storage
                .from('images')
                .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

            if (data?.signedUrl) {
                setFrontImage(data.signedUrl);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            toast("Failed to upload image", "error");
        } finally {
            setIsUploading(false);
        }
    };

    const handleGenerateMessage = async () => {
        if (!committeeName) {
            toast("Please complete step 1 first", "error");
            return;
        }

        setIsGenerating(true);
        try {
            const { data, error } = await supabase.functions.invoke('generate-message', {
                body: {
                    donorName: "%FIRST_NAME%", // Template placeholder
                    donationAmount: 50, // Example
                    accountName: committeeName,
                    history: []
                }
            });

            if (error) throw error;
            if (data?.message) {
                setBackMessage(data.message);
            }
        } catch (error) {
            console.error('Error generating AI message:', error);
            toast("Failed to generate message", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveAll = async () => {
        setLoading(true);
        try {
            const numericId = parseInt(entityId);
            // Create/Update account with all details
            await onSaveAccount({
                entity_id: numericId,
                committee_name: committeeName,
                disclaimer: disclaimer,
                street_address: streetAddress,
                city: city,
                state: state,
                postal_code: zip,
                front_image_url: frontImage || undefined,
                back_message: backMessage
            });
            setStep(5);
        } catch (e) {
            // Toast handled in App.tsx
        } finally {
            setLoading(false);
        }
    };

    const getPreviewMessage = (msg: string) => {
        return msg
            .replace(/%FULL_NAME%/g, `${DEMO_DONOR.firstname} ${DEMO_DONOR.lastname}`)
            .replace(/%FIRST_NAME%/g, DEMO_DONOR.firstname)
            .replace(/%LAST_NAME%/g, DEMO_DONOR.lastname)
            .replace(/%DONATION_AMOUNT%/g, DEMO_DONOR.amount)
            .replace(/%ADDRESS%/g, DEMO_DONOR.addr1)
            .replace(/%ADDRESS2%/g, DEMO_DONOR.addr2)
            .replace(/%CITY%/g, DEMO_DONOR.city)
            .replace(/%STATE%/g, DEMO_DONOR.state)
            .replace(/%ZIP%/g, DEMO_DONOR.zip)
            .replace(/%DONATION_DAY%/g, DEMO_DONOR.date)
            .replace(/%CURRENT_DAY%/g, DEMO_DONOR.date);
    };

    const previewText = getPreviewMessage(backMessage);
    const dynamicFontSize = Math.max(9, 11 - (backMessage.length / 500) * 2);

    return (
        <div className={`space-y-8 mx-auto transition-all duration-500 ease-in-out max-w-3xl`}>
            <div className="text-center mb-12">
                <h2 className="text-3xl font-serif font-bold text-stone-800">
                    {currentAccount?.id === 'new' ? 'Campaign Setup' : 'Connection Details'}
                </h2>
                <p className="text-stone-500 mt-2">Let's get your campaign set up to send gratitude.</p>
            </div>

            <div className="relative max-w-3xl mx-auto">
                <div className="absolute top-5 left-0 w-full h-1 bg-stone-100 -z-10 rounded-full"></div>
                <div className="flex justify-between w-full max-w-2xl mx-auto mb-12">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <div key={s} className={`flex flex-col items-center gap-2 ${step >= s ? 'opacity-100' : 'opacity-40'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= s ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-stone-200 text-stone-500'}`}>
                                {s}
                            </div>
                            <span className="text-xs font-medium text-stone-500">
                                {s === 1 ? 'Campaign' : s === 2 ? 'Address' : s === 3 ? 'Visuals' : s === 4 ? 'Message' : 'Webhook'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className={`bg-white p-8 rounded-2xl border border-stone-100 shadow-xl shadow-stone-200/50`}>

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
                                {loading ? <Loader2 className="animate-spin" /> : <>Next: Design Postcard <ArrowRight size={18} /></>}
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex items-start gap-4">
                            <div className="bg-purple-50 p-3 rounded-xl text-purple-500">
                                <ImageIcon size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-stone-800">Front Visual</h3>
                                <p className="text-stone-500 text-sm mt-1">Upload an image for the front of your postcard.</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center hover:border-rose-300 hover:bg-rose-50/50 transition-all cursor-pointer relative group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    disabled={isUploading}
                                />
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center group-hover:bg-white transition-colors">
                                        {isUploading ? <Loader2 className="animate-spin text-stone-400" /> : <Upload className="text-stone-400 group-hover:text-rose-500" />}
                                    </div>
                                    <div className="text-stone-600 font-medium">Click to upload an image</div>
                                    <div className="text-xs text-stone-400">JPG or PNG, max 5MB</div>
                                </div>
                            </div>

                            {frontImage && (
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-stone-700 block">Preview</label>
                                    <div className="aspect-[6/4] bg-white shadow-lg rounded-sm overflow-hidden border border-stone-100 relative w-full max-w-md mx-auto group">
                                        <div className="w-full h-full relative">
                                            <img src={frontImage} alt="Preview" className="w-full h-full object-cover" />
                                            {/* Committee Disclaimer (Front) */}
                                            {(disclaimer || committeeName) && (
                                                <div className="absolute bottom-0 left-0 right-0 px-4 py-2 z-10">
                                                    <p className="text-[7px] text-white uppercase leading-[1.2] tracking-tight text-center">
                                                        {disclaimer || committeeName}.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute top-3 right-3 bg-white/90 p-1.5 rounded-full shadow-sm text-emerald-600">
                                            <Check size={18} />
                                        </div>
                                    </div>
                                    <p className="text-center text-xs text-stone-400">Your design will be printed on high-quality 4x6" cardstock</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between pt-4">
                            <button
                                onClick={() => setStep(2)}
                                className="px-6 py-4 text-stone-500 font-medium hover:bg-stone-50 rounded-xl transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setStep(4)}
                                disabled={!frontImage}
                                className="bg-stone-800 text-white font-bold px-8 py-4 rounded-xl hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                Next: Write Message <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex items-start gap-4">
                            <div className="bg-indigo-50 p-3 rounded-xl text-indigo-500">
                                <MessageSquare size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-stone-800">Back Message</h3>
                                <p className="text-stone-500 text-sm mt-1">Write a template message. We'll replace <code>%FIRST_NAME%</code> with the donor's name.</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-stone-700">Message Template</label>
                                <button
                                    onClick={handleGenerateMessage}
                                    disabled={isGenerating}
                                    className="text-xs flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors font-medium"
                                >
                                    {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                    Write with AI
                                </button>
                            </div>
                            <div className="relative">
                                <textarea
                                    value={backMessage}
                                    onChange={(e) => setBackMessage(e.target.value)}
                                    placeholder="Dear %FIRST_NAME%, thank you for your support..."
                                    rows={6}
                                    className="w-full p-4 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all resize-none text-base leading-relaxed"
                                />
                                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                    <button
                                        onClick={() => setShowPreview(true)}
                                        className="bg-white/80 backdrop-blur-sm border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-300 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
                                        title="Preview Back"
                                    >
                                        <Eye size={14} /> Preview
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-stone-400 text-right">{backMessage.length} characters</p>
                        </div>

                        {showPreview && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200" onClick={() => setShowPreview(false)}>
                                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                                    <div className="bg-stone-50 border-b border-stone-100 p-4 flex justify-between items-center">
                                        <h3 className="font-bold text-stone-800 flex items-center gap-2">
                                            <Eye size={16} className="text-stone-400" /> Back Preview
                                        </h3>
                                        <button onClick={() => setShowPreview(false)} className="text-stone-400 hover:text-stone-600">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="p-8 bg-stone-200/50 flex justify-center">
                                        <div className="w-full max-w-md aspect-[6/4] bg-stone-50 relative flex flex-col p-6 overflow-hidden shadow-xl rounded-sm">
                                            {/* Left message side */}
                                            <div className="flex-1 pr-[45%] flex flex-col">
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-stone-800 leading-[1.3] whitespace-pre-wrap font-sans transition-all duration-300" style={{ fontSize: `${dynamicFontSize}pt` }}>
                                                        {previewText || "Your thank you message will appear here..."}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Right address side */}
                                            <div className="absolute left-[52%] top-0 right-0 bottom-0 p-6 flex flex-col justify-end">
                                                <div className="flex items-end justify-between gap-4 mb-4 pb-2">
                                                    <div className="text-[8px] text-stone-500 uppercase leading-snug font-medium max-w-[60%]">
                                                        <div className="font-bold text-stone-700 truncate">{committeeName || 'Committee Name'}</div>
                                                        <div className="truncate">{streetAddress || '123 Campaign St'}</div>
                                                        <div className="truncate">
                                                            {city || 'City'}, {state || 'ST'} {zip || '12345'}
                                                        </div>
                                                    </div>

                                                    <div className="w-14 h-10 border border-stone-800 flex flex-col items-center justify-center p-0.5 text-center font-bold bg-white shrink-0">
                                                        <span className="text-[7px] uppercase tracking-tighter leading-none">Postage</span>
                                                        <span className="text-[7px] uppercase tracking-tighter leading-none">Indicia</span>
                                                    </div>
                                                </div>

                                                <div className="mb-6 space-y-0.5 px-2 py-1">
                                                    <div className="text-[13px] font-bold text-stone-800 uppercase tracking-wide">
                                                        {DEMO_DONOR.firstname} {DEMO_DONOR.lastname}
                                                    </div>
                                                    <div className="text-[11px] text-stone-700 uppercase">
                                                        {DEMO_DONOR.addr1}
                                                    </div>
                                                    <div className="text-[11px] text-stone-700 uppercase">
                                                        {DEMO_DONOR.city}, {DEMO_DONOR.state} {DEMO_DONOR.zip}
                                                    </div>
                                                </div>

                                                {/* Branding Logo - Top Right */}
                                                <img
                                                    src="/mailed-by-logo.png"
                                                    alt="Mailed by ThankDonors.com"
                                                    className="absolute top-6 right-6 w-16 opacity-80 z-20"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-stone-50 p-4 text-center">
                                        <button onClick={() => setShowPreview(false)} className="text-sm font-medium text-stone-600 hover:text-stone-900">
                                            Close Preview
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between pt-4">
                            <button
                                onClick={() => setStep(3)}
                                className="px-6 py-4 text-stone-500 font-medium hover:bg-stone-50 rounded-xl transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSaveAll}
                                disabled={backMessage.length < 10 || loading}
                                className="bg-stone-800 text-white font-bold px-8 py-4 rounded-xl hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <>Next: Connect <ArrowRight size={18} /></>}
                            </button>
                        </div>
                    </div>
                )}

                {step === 5 && currentAccount && isAccountCreated && (
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
                            <button onClick={() => setStep(3)} className="text-xs text-stone-400 hover:text-stone-600">Back to Design</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActBlueConnect;