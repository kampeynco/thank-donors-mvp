import React, { useState, useEffect } from 'react';
import { Profile, ActBlueAccount } from '../types';
import { Webhook, Copy, Check, Home, Save, MapPin, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from './ToastContext';

interface SettingsProps {
  profile: Profile;
  currentAccount: ActBlueAccount | null;
  onUpdate: (profile: Partial<Profile>) => void;
  onDeleteAccount: () => void;
  onSaveAccount: (account: Partial<ActBlueAccount>) => Promise<void>;
}

const Settings: React.FC<SettingsProps> = ({ profile, currentAccount, onUpdate, onDeleteAccount, onSaveAccount }) => {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const [committeeName, setCommitteeName] = useState('');
  
  const [address, setAddress] = useState({
      street_address: '',
      city: '',
      state: '',
      postal_code: ''
  });

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
      } else {
          setCommitteeName('');
          setAddress({ street_address: '', city: '', state: '', postal_code: '' });
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
            postal_code: address.postal_code
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

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-serif font-bold text-stone-800">Account Settings</h2>
        <p className="text-stone-500 mt-2">Manage your campaign details and integration configuration.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        <div className="bg-white p-8 rounded-2xl border border-stone-100 shadow-sm">
            <h3 className="font-bold text-stone-800 flex items-center gap-2 mb-6 text-lg">
                <Home size={20} className="text-rose-500" />
                Committee Details
            </h3>
            
            <div className="grid grid-cols-1 gap-6 mb-6">
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

            <div className="mt-8 flex justify-end">
                <button 
                    type="submit"
                    disabled={isSaving || !currentAccount || currentAccount.id === 'new'}
                    className="bg-stone-800 text-white font-bold py-3 px-8 rounded-xl hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-stone-200 disabled:opacity-70"
                >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                    Save Details
                </button>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
            <h3 className="font-bold text-stone-800 flex items-center gap-2 mb-4">
                <Webhook size={20} className="text-rose-500" />
                Webhook Credentials
            </h3>
            <p className="text-xs text-stone-500 mb-4">
                Required for your ActBlue webhook configuration (Basic Auth). These credentials are specific to the <strong>{currentAccount?.committee_name || 'selected'}</strong> campaign.
            </p>

            {currentAccount && currentAccount.id !== 'new' ? (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-stone-400 mb-1 uppercase tracking-wider">Endpoint URL</label>
                        <div className="flex gap-2">
                            <code className="flex-1 bg-stone-50 p-2.5 rounded-lg text-xs font-mono text-stone-600 truncate border border-stone-100 select-all">
                                {currentAccount.webhook_url}
                            </code>
                            <button 
                                type="button" 
                                onClick={() => copyToClipboard(currentAccount.webhook_url, 'url')}
                                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
                                title="Copy URL"
                            >
                                {copiedField === 'url' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                            </button>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-medium text-stone-400 mb-1 uppercase tracking-wider">Username</label>
                        <div className="flex gap-2">
                            <code className="flex-1 bg-stone-50 p-2.5 rounded-lg text-xs font-mono text-stone-600 truncate border border-stone-100 select-all">
                                {currentAccount.webhook_username}
                            </code>
                            <button 
                                type="button" 
                                onClick={() => copyToClipboard(currentAccount.webhook_username, 'username')}
                                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
                                title="Copy Username"
                            >
                                {copiedField === 'username' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-stone-400 mb-1 uppercase tracking-wider">Password</label>
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
        </div>

        {currentAccount && currentAccount.id !== 'new' && (
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
        )}

      </form>

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