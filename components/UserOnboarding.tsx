import React, { useState } from 'react';
import { User, ArrowRight, Loader2, Heart } from 'lucide-react';
import { Profile } from '../types';

interface UserOnboardingProps {
    profile: Profile;
    onUpdateProfile: (profile: Partial<Profile>) => Promise<void>;
    onComplete: () => void;
}

const UserOnboarding: React.FC<UserOnboardingProps> = ({ profile, onUpdateProfile, onComplete }) => {
    const [fullName, setFullName] = useState(profile.full_name || '');
    const [organization, setOrganization] = useState(profile.organization || '');
    const [jobTitle, setJobTitle] = useState(profile.job_title || '');
    const [loading, setLoading] = useState(false);

    const handleSaveUserDetails = async () => {
        setLoading(true);
        try {
            await onUpdateProfile({
                full_name: fullName,
                organization: organization,
                job_title: jobTitle
            });
            onComplete();
        } catch (e) {
            console.error("Error saving user details", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-rose-200 mx-auto mb-4">
                    <Heart size={32} fill="currentColor" />
                </div>
                <h1 className="font-serif font-bold text-3xl text-stone-800">Welcome to Thank Donors</h1>
                <p className="text-stone-500 mt-2">Let's get to know you before we set up your campaign.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-stone-100 shadow-xl shadow-stone-200/50 w-full max-w-lg">
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-start gap-4">
                        <div className="bg-rose-50 p-3 rounded-xl text-rose-500">
                            <User size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-stone-800">About You</h3>
                            <p className="text-stone-500 text-sm mt-1">Tell us a bit about who is managing this account.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-stone-700 block mb-1">Full Name</label>
                            <input 
                                type="text" 
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="e.g. Jane Doe"
                                className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="text-sm font-medium text-stone-700 block mb-1">Organization</label>
                                <input 
                                    type="text" 
                                    value={organization}
                                    onChange={(e) => setOrganization(e.target.value)}
                                    placeholder="e.g. Progressive Victory"
                                    className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-stone-700 block mb-1">Job Title</label>
                                <input 
                                    type="text" 
                                    value={jobTitle}
                                    onChange={(e) => setJobTitle(e.target.value)}
                                    placeholder="e.g. Campaign Manager"
                                    className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleSaveUserDetails}
                        disabled={fullName.length < 2 || loading}
                        className="w-full bg-stone-800 text-white font-bold py-4 rounded-xl hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <>Continue to Campaign Setup <ArrowRight size={18} /></>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserOnboarding;
