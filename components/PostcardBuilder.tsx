
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Sparkles, Eye, Type, Image as ImageIcon, Plus, Loader2, Save } from 'lucide-react';
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
  const [message, setMessage] = useState(template.backpsc_message_template || "Dear %FIRST_NAME%,\n\nThank you so much for your generous support! Your contribution helps us fight for a better future.\n\nWith gratitude,");
  const [frontImage, setFrontImage] = useState<string | null>(template.frontpsc_background_image || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [tone, setTone] = useState<'warm' | 'formal' | 'urgent'>('warm');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state with props when account changes or template data updates from parent
  useEffect(() => {
    if (account) {
        setFrontImage(template.frontpsc_background_image || null);
        
        // Only update message if it's different to avoid overwriting work in progress 
        // unless we switched accounts
        if (template.backpsc_message_template) {
             setMessage(template.backpsc_message_template);
        }
    }
  }, [account?.id, template.frontpsc_background_image]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        toast("Image must be smaller than 5MB", "error");
        return;
    }

    setIsUploading(true);
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${profile.id}/${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Attempt upload to 'images' bucket
        const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, file);

        if (uploadError) {
             throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);

        setFrontImage(publicUrl);
        toast("Image uploaded successfully!", "success");

    } catch (error: any) {
        console.error("Upload error:", error);
        // Fallback: If storage bucket not set up, just use base64 for demo purposes
        const reader = new FileReader();
        reader.onloadend = () => {
             setFrontImage(reader.result as string);
             toast("Storage not available. Using local preview.", "info");
        };
        reader.readAsDataURL(file);
    } finally {
        setIsUploading(false);
    }
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
    try {
        await onSave({
            backpsc_message_template: message,
            frontpsc_background_image: frontImage || undefined
        });
        toast("Design saved successfully!", "success");
    } catch (error) {
        // App.tsx usually handles global errors
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
                      <div className="flex flex-col items-center text-rose-500">
                          <Loader2 size={32} className="animate-spin mb-4" />
                          <span className="font-bold">Uploading...</span>
                      </div>
                  ) : (
                      <>
                        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-4 group-hover:scale-110 transition-transform relative z-10">
                            <Upload size={32} />
                        </div>
                        <span className="text-stone-600 font-bold text-lg relative z-10">Click to upload image</span>
                        <span className="text-stone-400 text-sm mt-2 relative z-10">JPG or PNG supported (Max 5MB)</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        
                        {frontImage && (
                            <div className="absolute inset-0 opacity-10 bg-center bg-cover" style={{ backgroundImage: `url(${frontImage})` }}></div>
                        )}
                      </>
                  )}
                </label>
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
                        frontImage ? (
                            <img 
                                key={frontImage} 
                                src={frontImage} 
                                alt="Postcard Front" 
                                className="w-full h-full object-cover bg-stone-100" 
                            />
                        ) : (
                            <div className="w-full h-full bg-stone-100 flex flex-col items-center justify-center text-stone-300 gap-4">
                                <ImageIcon size={48} className="opacity-50" />
                                <p className="font-medium">No front image uploaded</p>
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
