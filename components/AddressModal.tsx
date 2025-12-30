import React, { useState } from 'react';
import { X, MapPin, Loader2, Check } from 'lucide-react';
import { Donation } from '../types';
import { supabase } from '../services/supabaseClient';
import { useToast } from './ToastContext';

interface AddressModalProps {
    donation: Donation;
    onClose: () => void;
    onSaveSuccess?: () => void;
}

const AddressModal: React.FC<AddressModalProps> = ({ donation, onClose, onSaveSuccess }) => {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        address_street: donation.address_street || '',
        address_city: donation.address_city || '',
        address_state: donation.address_state || '',
        address_zip: donation.address_zip || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // Map back to the database column names
            const { error } = await supabase
                .from('donations')
                .update({
                    donor_addr1: formData.address_street,
                    donor_city: formData.address_city,
                    donor_state: formData.address_state,
                    donor_zip: formData.address_zip
                })
                .eq('id', donation.id);

            if (error) throw error;

            toast("Address updated successfully!", "success");
            onSaveSuccess?.();
            onClose();
        } catch (err: any) {
            console.error("Failed to update address:", err);
            toast(`Failed to update address: ${err.message}`, "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-rose-100 p-2 rounded-lg">
                            <MapPin className="w-5 h-5 text-rose-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-stone-800">Update Address</h3>
                            <p className="text-xs text-stone-500 font-medium">{donation.donor_firstname} {donation.donor_lastname}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-stone-200 rounded-full transition-colors text-stone-400 hover:text-stone-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
                                Street Address
                            </label>
                            <input
                                type="text"
                                name="address_street"
                                value={formData.address_street}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all text-stone-800"
                                placeholder="123 Main St"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
                                City
                            </label>
                            <input
                                type="text"
                                name="address_city"
                                value={formData.address_city}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all text-stone-800"
                                placeholder="City"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
                                    State
                                </label>
                                <input
                                    type="text"
                                    name="address_state"
                                    value={formData.address_state}
                                    onChange={handleChange}
                                    required
                                    maxLength={2}
                                    className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all text-stone-800 uppercase"
                                    placeholder="CA"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
                                    ZIP Code
                                </label>
                                <input
                                    type="text"
                                    name="address_zip"
                                    value={formData.address_zip}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all text-stone-800"
                                    placeholder="90210"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-md shadow-rose-200 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Check size={18} />
                            )}
                            Update & Retry
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddressModal;
