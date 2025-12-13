
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Sparkles, Eye, Type, Image as ImageIcon, Plus, Loader2, Save, AlertTriangle, CheckCircle, AlertCircle, X, History, RefreshCw } from 'lucide-react';
import { generateThankYouMessage } from '../services/geminiService';
import { Profile, Template, ActBlueAccount } from '../types';
import { useToast } from './ToastContext';
import { supabase } from '../services/supabaseClient';

interface PostcardBuilderProps {
  profile: Profile;
  account: ActBlueAccount | null;
  template: Template;
  onSave: (data: Partial<Template>) => Promise<void>;
}

const VARIABLE_OPTIONS = [
    { label: 'Full Name', value: '%FULL_NAME%' },
    { label: 'First Name', value: '%FIRST_NAME%' },
    { label: 'Last Name', value: '%LAST_NAME%' },
    { label: 'Address Line 1', value: '%ADDRESS%' },
    { label: 'Address Line 2', value: '%ADDRESS2%' },
    { label: 'City', value: '%CITY%' },
    { label: 'State', value: '%STATE%' },
    { label: 'Zip Code', value: '%ZIP%' },
    { label: 'Donation Date', value: '%DONATION_DAY%' },
];

const DEMO_DONOR = {
    firstname: 'John',
    lastname: 'Smith',
    addr1: '123 Democracy Lane',
    addr2: 'Apt 4B',
    city: 'Washington',
    state: 'DC',
    zip: '20001',
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
};

const PostcardBuilder: React.FC<PostcardBuilderProps> = ({ profile, account, template, onSave }) => {
  const { toast } = useToast();
  const [viewSide, setViewSide] = useState<'front' | 'back'>('front');
  
  // Message State
  const [message, setMessage] = useState(template.backpsc_message_template || "Dear %FIRST_NAME%,\n\nThank you so much for your generous support! Your contribution helps us fight for a better future.\n\nWith gratitude,");

  // Image State
  // dbImage mirrors what is saved in the database (passed via props)
  const [dbImage, setDbImage] = useState<string | null>(template.frontpsc_background_image || null);
  // localImage holds the base64 preview of a newly uploaded file
  const [localImage, setLocalImage] = useState<string | null>(null);

  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null); // Track the remote URL of the newly uploaded image
  const [imageHistory, setImageHistory] = useState<string[]>([]); // Track recent uploads
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [tone, setTone] = useState<'warm' | 'formal' | 'urgent'>('warm');
  const [saveResult, setSaveResult] = useState<{ type: 'success' | 'warning' | 'error', message: string } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to get a fresh signed URL from a potential stale/public URL
  const getFreshSignedUrl = async (oldUrl: string): Promise<string | null> => {
      if (!oldUrl) return null;
      if (oldUrl.startsWith('data:')) return oldUrl;
      if (oldUrl.startsWith('blob:')) return null;

      try {
          // Robust parsing using URL object
          let urlObj: URL;
          try {
             urlObj = new URL(oldUrl);
          } catch {
             return null;
          }

          // Check if it's a Supabase Storage URL
          if (!urlObj.pathname.includes('/object/')) return null;

          // Split pathname to find bucket and key
          // Format: /storage/v1/object/[public|sign]/[BUCKET]/[KEY...]
          const parts = urlObj.pathname.split('/object/');
          if (parts.length < 2) return null;

          const pathSegments = parts[1].split('/'); // e.g. ['public', 'images', 'folder', 'file.jpg']
          if (pathSegments.length < 3) return null;

          // pathSegments[0] is 'public' or 'sign'
          const bucket = pathSegments[1];
          const key = decodeURIComponent(pathSegments.slice(2).join('/'));

          // Generate fresh signed URL
          const { data, error } = await supabase.storage
              .from(bucket)
              .createSignedUrl(key, 60 * 60 * 24 * 365); // 1 year

          if (data?.signedUrl) {
              return data.signedUrl;
          }
          
          return null;
      } catch (e) {
          console.error("Error refreshing signed URL:", e);
          return null;
      }
  };

  // Fetch recent uploads
  const fetchImageHistory = async () => {
    if (!profile?.id) return;
    
    try {
        const { data, error } = await supabase.storage
            .from('images')
            .list(profile.id, {
                limit: 6,
                sortBy: { column: 'updated_at', order: 'desc' }
            });
            
        if (!error && data) {
            const validFiles = data.filter(f => f.name !== '.emptyFolderPlaceholder');
            
            // Use Signed URLs to ensure visibility even if bucket is private
            const urls = await Promise.all(validFiles.map(async f => {
                 const { data: signedData } = await supabase.storage
                    .from('images')
                    .createSignedUrl(`${profile.id}/${f.name}`, 60 * 60 * 24 * 365);
                 return signedData?.signedUrl;
            }));

            setImageHistory(urls.filter(u => u) as string[]);
        }
    } catch (e) {
        console.error("Error fetching history:", e);
    }
  };

  // Effect 1: Handle Account Switching
  useEffect(() => {
    setLocalImage(null);
    setUploadedUrl(null);
    setImageLoadError(false);
    setSaveResult(null);
    setRetryCount(0);
  }, [account?.id]);

  // Effect 2: Sync State with Props (Template updates) & Refresh potentially stale URLs
  useEffect(() => {
    const syncImage = async () => {
        const incomingImage = template.frontpsc_background_image;
        if (!incomingImage) {
            setDbImage(null);
        } else {
            // Optimistically set it first
            setDbImage(incomingImage);
            
            // Try to refresh it to a fresh signed URL
            const freshUrl = await getFreshSignedUrl(incomingImage);
            if (freshUrl) {
                setDbImage(freshUrl);
                // If we have a fresh confirmed URL, clear local preview so we see the real thing
                if (localImage) setLocalImage(null);
            }
        }
    };

    syncImage();
    
    // Update message state if it has changed externally
    if (template.backpsc_message_template && template.backpsc_message_template !== message) {
         setMessage(template.backpsc_message_template);
    } 
    else if (template.backpsc_message_template && !message.includes('%FIRST_NAME%')) {
         setMessage(template.backpsc_message_template);
    }
  }, [template.frontpsc_background_image, template.backpsc_message_template, account?.id]);

  // Effect 3: Fetch history on mount/profile change
  useEffect(() => {
      fetchImageHistory();
  }, [profile.id]);

  const activeImage = localImage || uploadedUrl || dbImage;

  // Reset error when active image changes
  useEffect(() => {
      setImageLoadError(false);
      setRetryCount(0);
  }, [activeImage]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        toast("Image must be smaller than 5MB", "error");
        return;
    }

    setIsUploading(true);
    setUploadedUrl(null);
    setImageLoadError(false);

    // 1. Immediate Local Preview
    const reader = new FileReader();
    reader.onloadend = () => {
         setLocalImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const filePath = `${profile.id}/${sanitizedName}`;

        // Attempt upload
        const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        // Get fresh signed URL
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
        const errMsg = error?.message || "Upload failed";
        console.error("Upload failed:", errMsg);
        toast("Cloud upload failed. Using local preview.", "info");
    } finally {
        setIsUploading(false);
    }
  };

  const handleSelectHistoryImage = (url: string) => {
      setLocalImage(null);
      setUploadedUrl(url);
      setImageLoadError(false);
  };

  const handleAiGenerate = async () => {
    setIsGenerating(true);
    const cName = account?.committee_name || 'My Campaign';
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
            backpsc_message_template: message,
            frontpsc_background_image: imageToSave || undefined
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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-stone-800">Postcard Design</h2>
          <p className="text-stone-500 mt-2">Create the card your donors will hold in their hands.</p>
        </div>

        <div className="flex bg-stone-200 p-1 rounded-xl shadow-inner">
            <button 
                onClick={() => setViewSide('front')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                    viewSide === 'front' 
                    ? 'bg-white text-stone-800 shadow-sm transform scale-[1.02]' 
                    : 'text-stone-500 hover:text-stone-700'
                }`}
            >
                Front Side
            </button>
            <button 
                onClick={() => setViewSide('back')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                    viewSide === 'back' 
                    ? 'bg-white text-stone-800 shadow-sm transform scale-[1.02]' 
                    : 'text-stone-500 hover:text-stone-700'
                }`}
            >
                Back Side
            </button>
        </div>
      </div>

      {saveResult && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${
            saveResult.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
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
                  <h3 className="font-bold text-stone-800 flex items-center gap-2">
                    <ImageIcon size={20} className="text-rose-500" />
                    Front Image
                  </h3>
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
                        <span className="text-stone-400 text-sm mt-2 relative z-10">JPG or PNG supported (Max 5MB)</span>
                        <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
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
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-stone-200">
                            {imageHistory.map((url, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => handleSelectHistoryImage(url)}
                                    className={`relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                                        activeImage === url 
                                        ? 'border-rose-500 ring-2 ring-rose-200' 
                                        : 'border-stone-200 hover:border-rose-300'
                                    }`}
                                >
                                    <img 
                                        src={url} 
                                        className="w-full h-full object-cover" 
                                        alt="History" 
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement!.style.display = 'none';
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
              </div>
          ) : (
              <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                  <h3 className="font-bold text-stone-800 flex items-center gap-2">
                    <Type size={20} className="text-rose-500" />
                    Message Builder
                  </h3>
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
                        activeImage && !imageLoadError ? (
                            <img 
                                key={`${activeImage}-${retryCount}`}
                                src={activeImage} 
                                alt="Postcard Front" 
                                crossOrigin="anonymous"
                                className="w-full h-full object-cover bg-stone-100" 
                                onError={() => {
                                    console.error("Image load failed for:", activeImage);
                                    setImageLoadError(true);
                                }}
                            />
                        ) : (
                            <div className="w-full h-full bg-stone-100 flex flex-col items-center justify-center text-stone-300 gap-4 p-8 text-center">
                                {activeImage && imageLoadError ? (
                                    <>
                                        <AlertCircle size={48} className="text-rose-400 opacity-80" />
                                        <p className="font-medium text-rose-500">Failed to load image</p>
                                        <button 
                                            onClick={() => {
                                                setImageLoadError(false);
                                                setRetryCount(c => c + 1);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm text-xs font-bold text-stone-600 hover:text-stone-800 transition-colors"
                                        >
                                            <RefreshCw size={12} /> Retry Load
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon size={48} className="opacity-50" />
                                        <p className="font-medium">No front image uploaded</p>
                                    </>
                                )}
                            </div>
                        )
                    ) : (
                        <div className="w-full h-full flex bg-white relative">
                            <div className="w-[55%] h-full p-4 md:p-8 flex flex-col">
                                <div className="flex-1 font-sans text-[8px] sm:text-[10px] md:text-xs text-stone-800 leading-relaxed whitespace-pre-wrap overflow-hidden">
                                    {previewText}
                                </div>
                            </div>

                            <div className="w-[45%] h-full relative">
                                <div className="absolute top-3 right-3 md:top-6 md:right-6 w-[50px] h-[40px] md:w-[70px] md:h-[55px] border border-stone-800 flex flex-col items-center justify-center gap-0.5">
                                    <span className="text-[5px] md:text-[7px] font-bold uppercase tracking-wider text-stone-800">Postage</span>
                                    <span className="text-[5px] md:text-[7px] font-bold uppercase tracking-wider text-stone-800">Indicia</span>
                                </div>

                                <div className="absolute top-[32%] left-2 md:left-4 text-[6px] sm:text-[8px] md:text-[9px] text-stone-600 font-sans leading-tight">
                                    <p className="text-stone-900 font-bold uppercase mb-0.5">
                                        {account?.committee_name || 'CAMPAIGN NAME'}
                                    </p>
                                    {account?.street_address ? (
                                        <>
                                            <p>{account.street_address}</p>
                                            <p>{account.city}, {account.state} {account.postal_code}</p>
                                        </>
                                    ) : (
                                        <>
                                            <p>123 CAMPAIGN WAY</p>
                                            <p>CITY, ST 12345</p>
                                        </>
                                    )}
                                </div>
                                
                                <div className="absolute bottom-4 left-4 right-2 md:bottom-10 md:left-8 md:right-4 text-[8px] sm:text-[10px] md:text-xs font-sans text-stone-800 leading-snug uppercase tracking-wide">
                                    <p className="font-bold text-[9px] sm:text-[11px] md:text-sm mb-0.5 md:mb-1">{DEMO_DONOR.firstname} {DEMO_DONOR.lastname}</p>
                                    <p>{DEMO_DONOR.addr1}</p>
                                    <p>{DEMO_DONOR.addr2}</p>
                                    <p>{DEMO_DONOR.city}, {DEMO_DONOR.state} {DEMO_DONOR.zip}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="mt-6 text-center text-stone-400 text-xs max-w-xs mx-auto">
                {viewSide === 'front' 
                    ? "This image will cover the entire front of the 6x4 inch postcard."
                    : "Live preview shows demo data. Actual cards will use real donor info."
                }
            </div>
        </div>
      </div>
    </div>
  );
};

export default PostcardBuilder;
