import React, { useState } from 'react';
import { Profile } from '../types';
import { User, Lock, Loader2, AlertTriangle, Save, Shield, Trash2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useToast } from './ToastContext';

interface ProfileViewProps {
    profile: Profile;
    activeSection: string;
    setActiveSection: (section: string) => void;
    onUpdate: (profile: Partial<Profile>) => void;
    onDeleteUser: () => void;
}

import SettingsLayout from './SettingsLayout';

const ProfileView: React.FC<ProfileViewProps> = ({ profile, activeSection, setActiveSection, onUpdate, onDeleteUser }) => {
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
        <>
            <SettingsLayout>
                {activeSection === 'profile' && (
                    <div className="bg-white p-8 rounded-2xl border border-stone-100 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="font-bold text-stone-800 flex items-center gap-2 mb-6 text-lg">
                            <User size={20} className="text-orange-500" />
                            User Information
                        </h3>
                        <form onSubmit={handleUpdateInfo} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-stone-600">Full Name</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                        placeholder="Jane Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-stone-600">Email Address</label>
                                    <input
                                        type="email"
                                        value={profile.email || ''}
                                        disabled
                                        className="w-full p-3 bg-stone-100 border border-stone-200 rounded-xl text-stone-500 cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-stone-600">Organization</label>
                                    <input
                                        type="text"
                                        value={organization}
                                        onChange={(e) => setOrganization(e.target.value)}
                                        className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                        placeholder="Campaign Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-stone-600">Job Title</label>
                                    <input
                                        type="text"
                                        value={jobTitle}
                                        onChange={(e) => setJobTitle(e.target.value)}
                                        className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                        placeholder="Campaign Manager"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={isUpdatingInfo}
                                    className="bg-stone-900 text-white font-bold py-3 px-8 rounded-xl hover:bg-black transition-all shadow-lg shadow-stone-200 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isUpdatingInfo ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Save size={18} />
                                    )}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {activeSection === 'security' && (
                    <div className="bg-white p-8 rounded-2xl border border-stone-100 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="font-bold text-stone-800 flex items-center gap-2 mb-6 text-lg">
                            <Lock size={20} className="text-orange-500" />
                            Password & Security
                        </h3>
                        <form onSubmit={handlePasswordUpdate} className="max-w-md space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-stone-600">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-stone-900 text-white font-bold py-3 px-8 rounded-xl hover:bg-black transition-all shadow-lg shadow-stone-200 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Shield size={18} />
                                    )}
                                    Update Password
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {activeSection === 'danger' && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-rose-50 p-8 rounded-2xl border border-rose-100">
                            <h3 className="font-bold text-rose-800 flex items-center gap-2 mb-4 text-lg">
                                <AlertTriangle size={20} />
                                Delete User Account
                            </h3>
                            <p className="text-stone-600 mb-6">
                                This will permanently delete your user account and <strong>ALL data</strong> across all your campaigns. This action cannot be undone.
                            </p>
                            <button
                                onClick={handleDeleteClick}
                                className="bg-white border border-rose-200 text-rose-600 font-bold py-3 px-6 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm flex items-center gap-2"
                            >
                                <Trash2 size={18} />
                                Delete Account
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
        </>
    );
};

export default ProfileView;