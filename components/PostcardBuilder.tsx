import React, { useState, useRef, useEffect } from 'react';
import {
    Check, CheckCircle, AlertTriangle, AlertCircle, X,
    ImageIcon, Loader2, Upload, History, Sparkles,
    RefreshCw, Trash2, Camera, Save, Undo,
    Maximize2, CheckCircle2, Plus, Eye, Type,
    Crop, ZoomIn, ZoomOut, Move
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useToast } from './ToastContext';
import { Template, ActBlueAccount, Profile } from '../types';
import { generateThankYouMessage } from '../services/geminiService';

const TARGET_WIDTH = 1875;
const TARGET_HEIGHT = 1275;
const ASPECT_RATIO = TARGET_WIDTH / TARGET_HEIGHT;

const VARIABLE_OPTIONS = [
    { label: 'Full Name', value: '%FULL_NAME%' },
    { label: 'First Name', value: '%FIRST_NAME%' },
    { label: 'Last Name', value: '%LAST_NAME%' },
    { label: 'Donation Date', value: '%DONATION_DAY%' },
    { label: 'Current Date', value: '%CURRENT_DAY%' },
    { label: 'Address Line 1', value: '%ADDRESS%' },
    { label: 'City', value: '%CITY%' },
    { label: 'State', value: '%STATE%' },
];

const DEMO_DONOR = {
    firstname: 'John',
    lastname: 'Donor',
    addr1: '123 Gratitude Way',
    addr2: '',
    city: 'Hopeville',
    state: 'CA',
    zip: '90210',
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
};

interface PostcardBuilderProps {
    currentAccount: ActBlueAccount | null;
    template: Template | null;
    onSave: (updates: { back_message: string; front_image_url?: string }) => Promise<void>;
    isLoading?: boolean;
}

const PostcardBuilder: React.FC<PostcardBuilderProps> = ({ currentAccount, template, onSave, isLoading }) => {
    const { toast } = useToast();
    const [viewSide, setViewSide] = useState<'front' | 'back'>('front');
    const [retryCount, setRetryCount] = useState(0);

    const [message, setMessage] = useState(template?.backpsc_message_template || '');
    const [dbImage, setDbImage] = useState<string | null>(template?.frontpsc_background_image || null);
    const [localImage, setLocalImage] = useState<string | null>(null);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const [imageHistory, setImageHistory] = useState<string[]>([]);
    const [imageLoadError, setImageLoadError] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [tone, setTone] = useState<'warm' | 'formal' | 'urgent'>('warm');
    const [saveResult, setSaveResult] = useState<{ type: 'success' | 'warning' | 'error', message: string } | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [cropState, setCropState] = useState({
        isOpen: false,
        imageSrc: '',
        zoom: 1,
        offset: { x: 0, y: 0 },
        originalFile: null as File | null,
        isDragging: false,
        dragStart: { x: 0, y: 0 }
    });
    const cropContainerRef = useRef<HTMLDivElement>(null);

    const getFreshSignedUrl = async (url: string | null): Promise<string | null> => {
        if (!url) return null;
        if (url.startsWith('data:')) return url;
        if (url.startsWith('blob:')) return null;

        try {
            let bucket = 'images';
            let key = '';

            if (url.includes('/storage/v1/object/')) {
                const urlObj = new URL(url);
                const parts = urlObj.pathname.split('/object/');
                if (parts.length < 2) return url;

                const pathSegments = parts[1].split('/').filter(Boolean);
                if (pathSegments.length < 2) return url;

                const modes = ['public', 'authenticated', 'sign'];
                if (modes.includes(pathSegments[0]) && pathSegments.length >= 3) {
                    bucket = pathSegments[1];
                    key = decodeURIComponent(pathSegments.slice(2).join('/'));
                } else {
                    bucket = pathSegments[0];
                    key = decodeURIComponent(pathSegments.slice(1).join('/'));
                }
            } else if (!url.startsWith('http')) {
                key = url;
            } else {
                return url;
            }

            const timeoutPromise = new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 5000)
            );

            const signedUrlPromise = supabase.storage
                .from(bucket)
                .createSignedUrl(key, 60 * 60 * 24 * 365);

            const result = await Promise.race([signedUrlPromise, timeoutPromise]) as any;

            if (!result || result.error || !result.data?.signedUrl) {
                const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(key);
                return publicData.publicUrl;
            }

            return result.data.signedUrl;
        } catch (e) {
            console.error('Error getting fresh signed URL:', e);
            return url;
        }
    };

    const fetchImageHistory = async () => {
        const entityId = currentAccount?.entity_id;
        const storagePath = entityId ? `entity_${entityId}` : 'default';
        if (!storagePath) return;

        try {
            const { data, error } = await supabase.storage
                .from('images')
                .list(storagePath, {
                    limit: 8,
                    sortBy: { column: 'updated_at', order: 'desc' }
                });

            if (!error && data) {
                const validFiles = data.filter(f => f.name !== '.emptyFolderPlaceholder');
                const urls = await Promise.all(validFiles.map(async f => {
                    const { data: signedData } = await supabase.storage
                        .from('images')
                        .createSignedUrl(`${storagePath}/${f.name}`, 60 * 60 * 24 * 365);
                    return signedData?.signedUrl;
                }));

                const validUrls = urls.filter(u => u) as string[];
                setImageHistory(validUrls);

                if (validUrls.length > 0 && !template?.frontpsc_background_image && !localImage && !uploadedUrl) {
                    const img = new Image();
                    img.onload = () => setUploadedUrl(validUrls[0]);
                    img.onerror = () => console.error('Failed to preload image');
                    img.src = validUrls[0];
                }
            }
        } catch (e) {
            console.error("Error fetching history:", e);
        }
    };

    useEffect(() => {
        setLocalImage(null);
        setUploadedUrl(null);
        setImageLoadError(false);
        setSaveResult(null);
        setRetryCount(0);
    }, [currentAccount?.id]);

    useEffect(() => {
        const incomingImage = template?.frontpsc_background_image;
        const incomingMessage = template?.backpsc_message_template;

        setLocalImage(null);
        setUploadedUrl(null);
        setImageLoadError(false);
        setRetryCount(0);

        const syncImage = async () => {
            if (!incomingImage) {
                setDbImage(null);
                return;
            }

            if (incomingImage.startsWith('http') || incomingImage.startsWith('data:')) {
                setDbImage(incomingImage);
            }

            const freshUrl = await getFreshSignedUrl(incomingImage);
            if (freshUrl) {
                setDbImage(freshUrl);
                setImageLoadError(false);
            } else if (!incomingImage.startsWith('http')) {
                setImageLoadError(true);
            }
        };

        syncImage();

        if (incomingMessage && incomingMessage !== message) {
            setMessage(incomingMessage);
        }
    }, [template?.frontpsc_background_image, template?.backpsc_message_template, currentAccount?.id]);

    const activeImage = localImage || uploadedUrl || dbImage;

    const handleImageError = async () => {
        setImageLoadError(false);

        setRetryCount(prev => {
            if (prev >= 2) {
                setImageLoadError(true);
                return prev;
            }

            (async () => {
                const currentImage = localImage || uploadedUrl || dbImage;

                if (!currentImage || currentImage.startsWith('data:') || currentImage.startsWith('blob:')) {
                    setImageLoadError(true);
                    return;
                }

                const freshUrl = await getFreshSignedUrl(currentImage);

                if (freshUrl && freshUrl !== currentImage) {
                    if (currentImage === dbImage) {
                        setDbImage(freshUrl);
                    } else if (currentImage === uploadedUrl) {
                        setUploadedUrl(freshUrl);
                    } else if (currentImage === localImage) {
                        setLocalImage(freshUrl);
                    }
                    setImageLoadError(false);
                } else {
                    setImageLoadError(true);
                }
            })();

            return prev + 1;
        });
    };

    useEffect(() => {
        if (activeImage) {
            setImageLoadError(false);
            setRetryCount(0);
        }
    }, [activeImage]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast("Image must be smaller than 10MB", "error");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setCropState({
                isOpen: true,
                imageSrc: reader.result as string,
                zoom: 1,
                offset: { x: 0, y: 0 },
                originalFile: file,
                isDragging: false,
                dragStart: { x: 0, y: 0 }
            });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const performUpload = async (file: File | Blob, fileName: string) => {
        setIsUploading(true);
        setUploadedUrl(null);
        setImageLoadError(false);

        const reader = new FileReader();
        reader.onloadend = () => {
            setLocalImage(reader.result as string);
        };
        reader.readAsDataURL(file);

        try {
            const sanitizedName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const timestamp = Date.now();
            const entityId = currentAccount?.entity_id || currentAccount?.entity?.id;
            const storagePath = entityId ? `entity_${entityId}` : 'default';
            const filePath = `${storagePath}/${timestamp}_${sanitizedName}`;

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, file, { upsert: true, contentType: file.type });

            if (uploadError) throw uploadError;

            const { data: signedData } = await supabase.storage
                .from('images')
                .createSignedUrl(filePath, 60 * 60 * 24 * 365);

            if (signedData?.signedUrl) {
                setUploadedUrl(signedData.signedUrl);
                toast("Image uploaded successfully!", "success");
                fetchImageHistory();
            } else {
                const { data: { publicUrl } } = supabase.storage
                    .from('images')
                    .getPublicUrl(filePath);
                setUploadedUrl(publicUrl);
            }

        } catch (error: any) {
            toast("Cloud upload failed. Using local preview.", "info");
        } finally {
            setIsUploading(false);
        }
    };

    const handleCropSave = async () => {
        if (!cropState.imageSrc) return;

        const canvas = document.createElement('canvas');
        canvas.width = TARGET_WIDTH;
        canvas.height = TARGET_HEIGHT;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            toast("Could not initialize image processor", "error");
            return;
        }

        const img = new Image();
        img.src = cropState.imageSrc;

        await new Promise((resolve) => {
            img.onload = resolve;
        });

        const viewW = 500;
        const viewH = viewW / ASPECT_RATIO;

        const scaleX = viewW / img.naturalWidth;
        const scaleY = viewH / img.naturalHeight;
        const baseScale = Math.max(scaleX, scaleY);

        const renderedW = img.naturalWidth * baseScale * cropState.zoom;
        const renderedH = img.naturalHeight * baseScale * cropState.zoom;

        const renderedX = (viewW - renderedW) / 2 + cropState.offset.x;
        const renderedY = (viewH - renderedH) / 2 + cropState.offset.y;

        const outputScale = TARGET_WIDTH / viewW;

        ctx.drawImage(
            img,
            renderedX * outputScale,
            renderedY * outputScale,
            renderedW * outputScale,
            renderedH * outputScale
        );

        canvas.toBlob((blob) => {
            if (blob && cropState.originalFile) {
                performUpload(blob, `cropped_${cropState.originalFile.name}`);
                setCropState(prev => ({ ...prev, isOpen: false }));
            } else {
                toast("Failed to process cropped image", "error");
            }
        }, 'image/jpeg', 0.95);
    };

    const handleCropMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setCropState(prev => ({
            ...prev,
            isDragging: true,
            dragStart: { x: e.clientX - prev.offset.x, y: e.clientY - prev.offset.y }
        }));
    };

    const handleCropMouseMove = (e: React.MouseEvent) => {
        if (!cropState.isDragging) return;
        e.preventDefault();
        setCropState(prev => ({
            ...prev,
            offset: { x: e.clientX - prev.dragStart.x, y: e.clientY - prev.dragStart.y }
        }));
    };

    const handleCropMouseUp = () => {
        setCropState(prev => ({ ...prev, isDragging: false }));
    };

    const handleSelectHistoryImage = (url: string) => {
        setLocalImage(null);
        setUploadedUrl(url);
        setImageLoadError(false);
    };

    const handleHistoryImageCrop = async (url: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
                setCropState({
                    isOpen: true,
                    imageSrc: reader.result as string,
                    zoom: 1,
                    offset: { x: 0, y: 0 },
                    originalFile: new File([blob], 'history_image.jpg', { type: blob.type }),
                    isDragging: false,
                    dragStart: { x: 0, y: 0 }
                });
            };
            reader.readAsDataURL(blob);
        } catch (e) {
            toast("Failed to load image for cropping", "error");
        }
    };

    const handleDeleteHistoryImage = async (url: string, e: React.MouseEvent) => {
        e.stopPropagation();

        try {
            const urlObj = new URL(url);
            const pathSegments = urlObj.pathname.split('/object/');
            if (pathSegments.length < 2) return;

            const parts = pathSegments[1].split('/');
            if (parts.length < 3) return;

            const bucket = parts[1];
            const key = decodeURIComponent(parts.slice(2).join('/'));

            const { error } = await supabase.storage.from(bucket).remove([key]);

            if (error) throw error;

            if (activeImage === url) {
                setLocalImage(null);
                setUploadedUrl(null);
                setDbImage(null);
            }

            await fetchImageHistory();
            toast("Image deleted", "info");
        } catch (e) {
            toast("Failed to delete image", "error");
        }
    };

    const handleAiGenerate = async () => {
        setIsGenerating(true);
        const cName = currentAccount?.committee_name || 'My Campaign';
        try {
            const generated = await generateThankYouMessage(cName, tone);
            setMessage(generated);
            toast("Message generated!", "success");
        } catch (error) {
            toast("Could not generate message.", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleInsertVariable = (variable: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = message;

        const newMessage = text.substring(0, start) + variable + text.substring(end);
        setMessage(newMessage);

        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + variable.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveResult(null);
        try {
            const imageToSave = uploadedUrl || dbImage;

            await onSave({
                back_message: message,
                front_image_url: imageToSave || undefined,
            });

            if (!imageToSave && !localImage) {
                setSaveResult({
                    type: 'warning',
                    message: "Design saved, but you haven't uploaded a front image yet."
                });
            } else {
                setSaveResult({
                    type: 'success',
                    message: "Design saved successfully!"
                });
            }
        } catch (error) {
            setSaveResult({
                type: 'error',
                message: "Failed to save design. Please try again."
            });
        } finally {
            setIsSaving(false);
        }
    };

    const getPreviewMessage = (msg: string) => {
        return msg
            .replace(/%FULL_NAME%/g, `${DEMO_DONOR.firstname} ${DEMO_DONOR.lastname}`)
            .replace(/%FIRST_NAME%/g, DEMO_DONOR.firstname)
            .replace(/%LAST_NAME%/g, DEMO_DONOR.lastname)
            .replace(/%ADDRESS%/g, DEMO_DONOR.addr1)
            .replace(/%ADDRESS2%/g, DEMO_DONOR.addr2)
            .replace(/%CITY%/g, DEMO_DONOR.city)
            .replace(/%STATE%/g, DEMO_DONOR.state)
            .replace(/%ZIP%/g, DEMO_DONOR.zip)
            .replace(/%DONATION_DAY%/g, DEMO_DONOR.date)
            .replace(/%CURRENT_DAY%/g, DEMO_DONOR.date);
    };

    const previewText = getPreviewMessage(message);

    return (
        <div className="space-y-8 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-stone-800">Postcard Designer</h2>
                    <p className="text-stone-500 mt-2 flex items-center gap-1.5 grayscale-0">
                        <Check size={14} className="text-emerald-500 flex-shrink-0" />
                        <span>Changes apply to all postcards sent from <b>{currentAccount?.committee_name || 'this campaign'}</b>.</span>
                    </p>
                </div>

                <div className="flex bg-stone-200 p-1 rounded-xl shadow-inner">
                    <button
                        onClick={() => setViewSide('front')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${viewSide === 'front'
                            ? 'bg-white text-stone-800 shadow-sm transform scale-[1.02]'
                            : 'text-stone-500 hover:text-stone-700'
                            }`}
                    >
                        Front Side
                    </button>
                    <button
                        onClick={() => setViewSide('back')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${viewSide === 'back'
                            ? 'bg-white text-stone-800 shadow-sm transform scale-[1.02]'
                            : 'text-stone-500 hover:text-stone-700'
                            }`}
                    >
                        Back Side
                    </button>
                </div>
            </div>

            {saveResult && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${saveResult.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                    saveResult.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                        'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                    <div className="mt-0.5">
                        {saveResult.type === 'success' && <CheckCircle size={20} className="text-emerald-600" />}
                        {saveResult.type === 'warning' && <AlertTriangle size={20} className="text-amber-600" />}
                        {saveResult.type === 'error' && <AlertCircle size={20} className="text-rose-600" />}
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-sm">
                            {saveResult.type === 'success' ? 'Success' : saveResult.type === 'warning' ? 'Attention Needed' : 'Error'}
                        </h4>
                        <p className="text-sm opacity-90">{saveResult.message}</p>
                    </div>
                    <button onClick={() => setSaveResult(null)} className="text-current opacity-50 hover:opacity-100">
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    {viewSide === 'front' ? (
                        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm animate-in fade-in duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex flex-col">
                                    <h3 className="font-bold text-stone-800 flex items-center gap-2">
                                        <ImageIcon size={20} className="text-rose-500" />
                                        Front Image
                                    </h3>
                                </div>
                                <span className="text-xs text-stone-400 bg-stone-100 px-2 py-1 rounded">1875 × 1275 px</span>
                            </div>

                            <label className="border-2 border-dashed border-stone-200 rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 hover:border-rose-300 transition-all group h-64 relative overflow-hidden">
                                {isUploading ? (
                                    <div className="flex flex-col items-center text-rose-500 z-20">
                                        <Loader2 size={32} className="animate-spin mb-4" />
                                        <span className="font-bold shadow-sm">Uploading...</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-4 group-hover:scale-110 transition-transform relative z-10">
                                            <Upload size={32} />
                                        </div>
                                        <span className="text-stone-600 font-bold text-lg relative z-10">Click to upload image</span>
                                        <span className="text-stone-400 text-sm mt-2 relative z-10">JPG or PNG supported (Max 10MB)</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            onClick={(e) => (e.currentTarget.value = '')}
                                        />

                                        {activeImage && !imageLoadError && (
                                            <div className="absolute inset-0 opacity-20 bg-center bg-cover" style={{ backgroundImage: `url(${activeImage})` }}></div>
                                        )}

                                        {activeImage && imageLoadError && (
                                            <div className="absolute top-2 right-2 bg-rose-100 text-rose-600 text-xs px-2 py-1 rounded-md flex items-center gap-1 z-20 font-bold">
                                                <AlertTriangle size={12} /> Image Load Error
                                            </div>
                                        )}
                                    </>
                                )}
                            </label>

                            {imageHistory.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="text-sm font-bold text-stone-700 flex items-center gap-2 mb-3">
                                        <History size={16} className="text-stone-400" />
                                        Recent Uploads
                                    </h4>
                                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                                        {imageHistory.map((url, idx) => {
                                            const isActive = activeImage === url;
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all group ${isActive
                                                        ? 'border-rose-500 ring-2 ring-rose-200 ring-offset-1'
                                                        : 'border-stone-100 hover:border-rose-300'
                                                        }`}
                                                >
                                                    <button
                                                        onClick={() => handleHistoryImageCrop(url)}
                                                        className="w-full h-full"
                                                    >
                                                        <img
                                                            src={url}
                                                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                            alt="History"
                                                        />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteHistoryImage(url, e)}
                                                        className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-rose-600 z-10"
                                                        title="Delete image"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                    {isActive && (
                                                        <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-center pointer-events-none">
                                                            <div className="bg-white rounded-full p-1 shadow-sm">
                                                                <Check size={12} className="text-rose-600 stroke-[4]" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm animate-in fade-in duration-300">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                                <div className="flex flex-col">
                                    <h3 className="font-bold text-stone-800 flex items-center gap-2">
                                        <Type size={20} className="text-rose-500" />
                                        Message Builder
                                    </h3>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="relative">
                                        <select
                                            onChange={(e) => {
                                                handleInsertVariable(e.target.value);
                                                e.target.value = '';
                                            }}
                                            className="text-xs border border-stone-200 bg-white rounded-md py-1.5 pl-2 pr-6 focus:ring-rose-500 font-medium text-stone-600 cursor-pointer hover:border-stone-300 appearance-none"
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Insert Variable...</option>
                                            {VARIABLE_OPTIONS.map(v => (
                                                <option key={v.value} value={v.value}>{v.label}</option>
                                            ))}
                                        </select>
                                        <Plus size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                                    </div>
                                    <div className="h-4 w-px bg-stone-200 hidden md:block"></div>
                                    <select
                                        value={tone}
                                        onChange={(e) => setTone(e.target.value as any)}
                                        className="text-xs border-none bg-stone-100 rounded-md py-1.5 pl-2 pr-6 focus:ring-rose-500 font-medium text-stone-600 cursor-pointer"
                                    >
                                        <option value="warm">Warm Tone</option>
                                        <option value="formal">Formal Tone</option>
                                        <option value="urgent">Urgent Tone</option>
                                    </select>
                                    <button
                                        onClick={handleAiGenerate}
                                        disabled={isGenerating}
                                        title="AI Assist"
                                        className="flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-500 text-white w-7 h-7 rounded-full hover:shadow-md transition-all disabled:opacity-50"
                                    >
                                        {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                    </button>
                                </div>
                            </div>

                            <textarea
                                ref={textareaRef}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full h-64 p-4 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none text-stone-700 leading-relaxed text-base font-sans"
                                placeholder="Write your thank you message here..."
                            />

                            <div className="flex justify-between items-center mt-3">
                                <p className="text-xs text-stone-400 italic">Use variables to personalize each card.</p>
                                <p className={`text-xs font-bold ${message.length > 300 ? 'text-rose-500' : 'text-stone-400'}`}>{message.length} chars</p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full bg-rose-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        {isSaving ? 'Saving...' : 'Save Design'}
                    </button>
                </div>

                <div className="bg-stone-200/50 rounded-3xl p-4 md:p-8 flex flex-col items-center justify-center min-h-[400px] md:min-h-[500px]">
                    <div className="text-stone-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Eye size={14} />
                        Live {viewSide === 'front' ? 'Front' : 'Back'} Preview
                    </div>

                    <div className="w-full max-w-lg">
                        <div className="relative aspect-[6/4] bg-white shadow-2xl rounded-sm overflow-hidden">
                            {viewSide === 'front' ? (
                                <div className="w-full h-full relative group">
                                    {activeImage && !imageLoadError ? (
                                        <img
                                            key={activeImage}
                                            src={activeImage}
                                            onError={handleImageError}
                                            onLoad={() => {
                                                setImageLoadError(false);
                                                setRetryCount(0);
                                            }}
                                            alt="Postcard Front"
                                            className="w-full h-full object-cover bg-stone-100"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-stone-50 border-2 border-dashed border-stone-200 rounded-sm">
                                            <ImageIcon size={48} className="text-stone-200 mb-4" />
                                            <p className="text-stone-400 font-medium">
                                                {imageLoadError ? 'Failed to load image' : 'No front image uploaded'}
                                            </p>
                                            {imageLoadError && (
                                                <button
                                                    onClick={() => {
                                                        setImageLoadError(false);
                                                        setRetryCount(0);
                                                        (async () => {
                                                            const currentImage = localImage || uploadedUrl || dbImage;
                                                            if (currentImage) {
                                                                const freshUrl = await getFreshSignedUrl(currentImage);
                                                                if (freshUrl) {
                                                                    if (currentImage === dbImage) setDbImage(freshUrl);
                                                                    else if (currentImage === uploadedUrl) setUploadedUrl(freshUrl);
                                                                }
                                                            }
                                                        })();
                                                    }}
                                                    className="mt-4 text-xs bg-stone-200 px-3 py-1.5 rounded-full hover:bg-stone-300 transition-colors font-bold text-stone-600"
                                                >
                                                    Retry Loading
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 border-8 border-white/10 pointer-events-none"></div>

                                    {/* Committee Disclaimer (Front) */}
                                    {(currentAccount?.disclaimer || currentAccount?.entity?.disclaimer) && (
                                        <div className="absolute bottom-0 left-0 right-0 px-4 py-2 z-10">
                                            <p className="text-[7px] text-white uppercase leading-[1.2] tracking-tight text-center">
                                                Paid for by {currentAccount?.disclaimer || currentAccount?.entity?.disclaimer}. Not authorized by any candidate or candidate's committee.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full h-full bg-stone-50 relative flex flex-col p-6 overflow-hidden">
                                    <div className="flex-1 pr-[45%] flex flex-col">
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-stone-800 leading-[1.3] whitespace-pre-wrap font-sans" style={{ fontSize: '11pt' }}>
                                                {previewText || "Your thank you message will appear here. Use variables like %FIRST_NAME% to personalize your message for each donor."}
                                            </p>
                                        </div>
                                    </div>

                                    {currentAccount?.entity?.branding_enabled !== false && (
                                        <div className="absolute top-4 right-4 w-16 h-16 pointer-events-none opacity-80">
                                            <img
                                                src="/thank_donors_stamp.png"
                                                alt="Thank Donors Stamp"
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}

                                    <div className="absolute left-[52%] top-0 right-0 bottom-0 p-6 flex flex-col justify-end">
                                        <div className="flex items-end justify-between gap-4 mb-4 pb-2">
                                            <div className="text-[8px] text-stone-500 uppercase leading-snug font-medium max-w-[60%]">
                                                <div className="font-bold text-stone-700 truncate">{currentAccount?.committee_name || 'Committee Name'}</div>
                                                <div className="truncate">{currentAccount?.entity?.street_address || currentAccount?.street_address || '123 Campaign St'}</div>
                                                <div className="truncate">
                                                    {currentAccount?.entity?.city || currentAccount?.city || 'City'},
                                                    {currentAccount?.entity?.state || currentAccount?.state || 'ST'}
                                                    {currentAccount?.entity?.postal_code || currentAccount?.postal_code || '12345'}
                                                </div>
                                            </div>

                                            <div className="w-14 h-10 border border-stone-800 flex flex-col items-center justify-center p-0.5 text-center font-bold bg-white shrink-0">
                                                <span className="text-[7px] uppercase tracking-tighter leading-none">Postage</span>
                                                <span className="text-[7px] uppercase tracking-tighter leading-none">Indicia</span>
                                            </div>
                                        </div>

                                        <div className="mb-6 space-y-0.5 px-2 py-1 bg-white/50 rounded">
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

                                        {(currentAccount?.disclaimer || currentAccount?.entity?.disclaimer) && (
                                            <div className="mt-2 pt-2">
                                                <p className="text-[7px] text-stone-500 uppercase leading-[1.1] tracking-tighter italic text-center">
                                                    Paid for by {currentAccount?.disclaimer || currentAccount?.entity?.disclaimer}. Not authorized by any candidate or candidate's committee.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {cropState.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/90 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                            <h3 className="text-xl font-serif font-bold text-stone-800 flex items-center gap-2">
                                <Crop size={24} className="text-rose-500" />
                                Refine Your Image
                            </h3>
                            <button onClick={() => setCropState(prev => ({ ...prev, isOpen: false }))} className="text-stone-400 hover:text-stone-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 flex flex-col items-center bg-stone-50/50">
                            <div className="bg-stone-200 p-2 rounded-xl shadow-inner mb-8">
                                <div
                                    ref={cropContainerRef}
                                    className="relative w-[500px] aspect-[6/4] bg-stone-800 overflow-hidden cursor-move rounded-sm shadow-xl"
                                    onMouseDown={handleCropMouseDown}
                                    onMouseMove={handleCropMouseMove}
                                    onMouseUp={handleCropMouseUp}
                                    onMouseLeave={handleCropMouseUp}
                                >
                                    <img
                                        src={cropState.imageSrc}
                                        alt="Crop area"
                                        draggable={false}
                                        style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: `translate(-50%, -50%) translate(${cropState.offset.x}px, ${cropState.offset.y}px) scale(${cropState.zoom})`,
                                            maxWidth: 'none',
                                            minWidth: '100%',
                                            minHeight: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                    <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/20"></div>
                                    <div className="absolute inset-0 border-[40px] border-stone-900/40 pointer-events-none"></div>
                                </div>
                            </div>

                            <div className="w-full max-w-md space-y-6">
                                <div className="flex items-center gap-4">
                                    <ZoomOut size={18} className="text-stone-400" />
                                    <input
                                        type="range"
                                        min="1"
                                        max="3"
                                        step="0.01"
                                        value={cropState.zoom}
                                        onChange={(e) => setCropState(prev => ({ ...prev, zoom: parseFloat(e.target.value) }))}
                                        className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                                    />
                                    <ZoomIn size={18} className="text-stone-400" />
                                </div>

                                <div className="flex items-center justify-center gap-3 text-stone-400 text-sm font-medium">
                                    <Move size={16} />
                                    <span>Drag image to reposition</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white border-t border-stone-100 flex justify-end gap-3">
                            <button
                                onClick={() => setCropState(prev => ({ ...prev, isOpen: false }))}
                                className="px-6 py-2.5 rounded-xl font-bold text-stone-500 hover:bg-stone-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCropSave}
                                className="px-8 py-2.5 bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all flex items-center gap-2"
                            >
                                <Check size={20} />
                                Apply Crop
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostcardBuilder;