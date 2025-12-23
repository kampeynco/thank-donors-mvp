
import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Clock, ArrowUpRight, Shield, Zap, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { Profile, BillingTransaction } from '../types';

const BillingView: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<BillingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) setProfile(profileData);

      // Fetch Transactions
      const { data: transData } = await supabase
        .from('billing_transactions')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });

      if (transData) setTransactions(transData);
    } catch (err) {
      console.error('Error fetching billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoTopup = async () => {
    if (!profile) return;
    try {
      const newValue = !profile.auto_topup_enabled;
      const { error } = await supabase
        .from('profiles')
        .update({ auto_topup_enabled: newValue })
        .eq('id', profile.id);

      if (error) throw error;
      setProfile({ ...profile, auto_topup_enabled: newValue });
    } catch (err) {
      console.error('Error toggling auto-topup:', err);
      alert('Failed to update settings.');
    }
  };

  const handleStripeCheckout = async (type: 'topup' | 'subscription') => {
    try {
      setProcessing(type);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ type })
      });

      const { url, error } = await response.json();
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Failed to initiate checkout. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-rose-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif font-bold text-stone-800">Billing & Pricing</h2>
          <p className="text-stone-500 mt-2">Manage your account balance and subscription tier.</p>
        </div>
        <div className="text-right">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${profile?.tier === 'pro' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600'
            }`}>
            {profile?.tier || 'Free'} Tier
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-8 text-white shadow-lg shadow-rose-200">
          <h3 className="font-bold flex items-center gap-2 mb-2 opacity-90 text-sm">
            <DollarSign size={18} />
            Available Balance
          </h3>
          <div className="text-4xl font-serif font-bold mb-6">
            ${((profile?.balance_cents || 0) / 100).toFixed(2)}
          </div>

          <div className="space-y-3 mb-8">
            <div className="flex justify-between text-sm opacity-90 border-b border-white/20 pb-2">
              <span>Cost per Postcard</span>
              <span className="font-bold">${profile?.tier === 'pro' ? '0.89' : '1.29'}</span>
            </div>
            <button
              onClick={handleToggleAutoTopup}
              className="w-full flex justify-between items-center text-sm opacity-90 border-b border-white/20 pb-2 hover:opacity-100 transition-opacity group"
            >
              <span>Auto-topup ($50 trigger)</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider">{profile?.auto_topup_enabled ? 'On' : 'Off'}</span>
                <div className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${profile?.auto_topup_enabled ? 'bg-emerald-500' : 'bg-white/30'}`}>
                  <div className={`absolute w-3.5 h-3.5 bg-white rounded-full transition-all shadow-sm ${profile?.auto_topup_enabled ? 'translate-x-4.5' : 'translate-x-1'}`} />
                </div>
              </div>
            </button>
          </div>

          <button
            onClick={() => handleStripeCheckout('topup')}
            disabled={!!processing}
            className="w-full bg-white text-rose-600 font-bold py-3 rounded-xl hover:bg-rose-50 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {processing === 'topup' ? <Loader2 className="animate-spin" size={20} /> : <Zap size={18} />}
            Add $50.00 Credits
          </button>
        </div>

        {/* Upgrade Card / Info */}
        <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-stone-800 flex items-center gap-2 mb-4">
              <Shield size={20} className="text-rose-500" />
              Upgrade to Pro
            </h3>
            <ul className="space-y-3 mb-6">
              {[
                'Lower cost ($0.89 vs $1.29)',
                'Priority support',
                'Advanced campaign analytics'
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-stone-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {profile?.tier === 'pro' ? (
            <button className="w-full bg-stone-100 text-stone-500 font-bold py-3 rounded-xl cursor-default">
              Current Plan
            </button>
          ) : (
            <button
              onClick={() => handleStripeCheckout('subscription')}
              disabled={!!processing}
              className="w-full bg-stone-800 text-white font-bold py-3 rounded-xl hover:bg-stone-900 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {processing === 'subscription' ? <Loader2 className="animate-spin" size={20} /> : null}
              Upgrade for $99.00/mo
            </button>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-2xl border border-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-stone-800 flex items-center gap-2">
            <Clock size={20} className="text-stone-400" />
            Transaction History
          </h3>
        </div>
        <div className="divide-y divide-stone-50">
          {transactions.length === 0 ? (
            <div className="p-12 text-center text-stone-400 text-sm">
              No transactions found yet.
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${tx.amount_cents > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-50 text-stone-500'}`}>
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-stone-800 text-sm capitalize">{tx.description || tx.type.replace('_', ' ')}</p>
                    <p className="text-xs text-stone-500">{new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${tx.amount_cents > 0 ? 'text-emerald-600' : 'text-stone-800'}`}>
                    {tx.amount_cents > 0 ? '+' : ''}${(tx.amount_cents / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingView;
