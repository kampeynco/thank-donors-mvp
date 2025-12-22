import React, { useState } from 'react';
import { Profile } from '../types';
import { User, Lock, Loader2, AlertTriangle, Save, Info } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useToast } from './ToastContext';

interface ProfileViewProps {
  profile: Profile;
  onUpdate: (profile: Partial<Profile>) => void;
  onDeleteUser: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ profile, onUpdate, onDeleteUser }) => {
  const { toast } = useToast();
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [organization, setOrganization] = useState(profile.organization || '');
  const [jobTitle, setJobTitle] = useState(profile.job_title || '');
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);

  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingInfo(true);
    try {
        await onUpdate({
            full_name: fullName,
            organization: organization,
            job_title: jobTitle
        });
        toast("Profile information updated.", "success");
    } catch (e) {
        console.error("Update failed", e);
        toast("Failed to update profile.", "error");
    } finally {
        setIsUpdatingInfo(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (newPassword.length < 6) {
        toast("Password must be at least 6 characters.", "error");
        setLoading(false);
        return;
    }

    try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        toast("Password updated successfully.", "success");
        setPassword('');
        setNewPassword('');
    } catch (err: any) {
        toast(err.message, "error");
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
    setDeleteConfirmation('');
  };
  
  const confirmDelete = () => {
      if (deleteConfirmation === 'DELETE') {
          onDeleteUser();
          setIsDeleteModalOpen(false);
      }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-serif font-bold text-stone-800">My Profile</h2>
        <p className="text-stone-500 mt-2">Manage your personal details and login credentials.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-blue-900 text-sm mb-1">Account Settings Disclaimer</h4>
          <p className="text-sm text-blue-800">Your account information is securely stored and encrypted. Any changes you make will be saved immediately. If you notice any unauthorized activity, please reset your password and contact support right away.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-8 rounded-2xl border border-stone-100 shadow-sm">
            <h3 className="font-bold text-stone-800 flex items-center gap-2 mb-6 text-lg">
                <User size={20} className="text-rose-500" />
                User Information
            </h3>
            
            <form onSubmit={handleUpdateInfo} className="grid grid-cols-1 gap-6">
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Full Name</label>
                    <input 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent" 
                        placeholder="Jane Doe"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">Organization</label>
                        <input 
                            value={organization}
                            onChange={(e) => setOrganization(e.target.value)}
                            className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent" 
                            placeholder="Campaign for Change"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">Job Title</label>
                        <input 
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent" 
                            placeholder="Campaign Manager"
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Email Address</label>
                    <input 
                        value={profile.email || ''}
                        disabled
                        className="w-full p-3 border border-stone-200 rounded-xl bg-stone-50 text-stone-500 cursor-not-allowed" 
                    />
                    <p className="text-xs text-stone-400 mt-2">To change your email, please contact support.</p>
                </div>

                <div className="flex justify-end pt-4">
                    <button 
                        type="submit"
                        disabled={isUpdatingInfo}
                        className="bg-stone-800 text-white font-bold py-3 px-8 rounded-xl hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-stone-200 disabled:opacity-70"
                    >
                        {isUpdatingInfo ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                        Save Changes
                    </button>
                </div>
            </form>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-stone-100 shadow-sm">
            <h3 className="font-bold text-stone-800 flex items-center gap-2 mb-6 text-lg">
                <Lock size={20} className="text-rose-500" />
                Security
            </h3>
            
            <form onSubmit={handlePasswordUpdate} className="grid grid-cols-1 gap-6">
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">New Password</label>
                    <input 
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent" 
                        placeholder="••••••••"
                        required
                    />
                </div>

                <div className="flex justify-end">
                    <button 
                        type="submit"
                        disabled={loading}
                        className="bg-white border border-stone-200 text-stone-600 font-bold py-3 px-8 rounded-xl hover:bg-stone-50 transition-all flex items-center gap-2 disabled:opacity-70"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />} 
                        Update Password
                    </button>
                </div>
            </form>
        </div>

        <div className="bg-rose-50 p-8 rounded-2xl border border-rose-100">
            <h3 className="font-bold text-rose-800 flex items-center gap-2 mb-4">
                <AlertTriangle size={20} />
                Danger Zone
            </h3>
            <p className="text-sm text-rose-600 mb-6">
                Deleting your account will remove all campaigns, donations, and settings. This action cannot be undone.
            </p>
            <button
                type="button"
                onClick={handleDeleteClick}
                className="bg-white border border-rose-200 text-rose-600 font-bold py-3 px-6 rounded-xl hover:bg-rose-600 hover:text-white transition-all"
            >
                Delete User Account
            </button>
        </div>
      </div>
      
      {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 mb-4 mx-auto">
                      <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-stone-800 mb-2 text-center">Delete User Account?</h3>
                  <p className="text-stone-500 mb-4 text-center text-sm">
                      This will permanently delete your user account and <strong>ALL data</strong>. This cannot be undone.
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

export default ProfileView;