
import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Clock, ArrowUpRight, Shield, Zap, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { Profile, BillingTransaction, ActBlueAccount, ActBlueEntity } from '../types';

interface BillingViewProps {
  profile: Profile;
  account: ActBlueAccount | null;
  onUpdateAccount: (updates: Partial<ActBlueEntity>) => Promise<void>;
}

const BillingView: React.FC<BillingViewProps> = ({ profile, account, onUpdateAccount }) => {
  const [transactions, setTransactions] = useState<BillingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const entity = account?.entity || account; // Fallback to flattened fields

  useEffect(() => {
    if (account?.entity_id) {
      fetchBillingData();
    }
  }, [account?.entity_id]);

  const fetchBillingData = async () => {
    if (!account?.entity_id) return;
    try {
      setLoading(true);
      const { data: transData } = await supabase
        .from('billing_transactions')
        .select('*')
        .eq('entity_id', account.entity_id)
        .order('created_at', { ascending: false });

      if (transData) setTransactions(transData);
    } catch (err) {
      console.error('Error fetching billing data:', err);
    } finally {
      setLoading(false);
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
        body: JSON.stringify({
          type,
          entity_id: account?.entity_id
        })
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

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-8 text-white shadow-lg shadow-rose-200">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold flex items-center gap-2 opacity-90 text-sm">
              <DollarSign size={18} />
              Campaign Available Balance
            </h3>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${entity?.tier === 'pro' ? 'bg-white text-amber-600' : 'bg-white/20 text-white backdrop-blur-sm'
              }`}>
              {entity?.tier || 'Free'} Tier
            </span>
          </div>
          <div className="text-4xl font-serif font-bold mb-6">
            ${((entity?.balance_cents || 0) / 100).toFixed(2)}
          </div>

          <div className="space-y-3 mb-8">
            <div className="flex justify-between text-sm opacity-90 border-b border-white/20 pb-2">
              <span>Cost per Postcard</span>
              <span className="font-bold">${entity?.tier === 'pro' ? '0.89' : '1.29'}</span>
            </div>
            <div className="flex justify-between items-center text-sm opacity-90 border-b border-white/20 pb-2">
              <span>Auto-topup trigger</span>
              <span className="font-bold">$10.00 balance</span>
            </div>
            <div className="flex justify-between items-center text-sm opacity-90 border-b border-white/20 pb-2">
              <span>Top-up refill amount</span>
              <select
                value={entity?.auto_topup_amount_cents || 5000}
                onChange={(e) => onUpdateAccount({ auto_topup_amount_cents: parseInt(e.target.value) })}
                className="bg-transparent font-bold text-right outline-none cursor-pointer border-none focus:ring-0 p-0"
              >
                <option value={5000} className="text-stone-800">$50.00</option>
                <option value={10000} className="text-stone-800">$100.00</option>
                <option value={25000} className="text-stone-800">$250.00</option>
                <option value={50000} className="text-stone-800">$500.00</option>
              </select>
            </div>
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

          {entity?.tier === 'pro' ? (
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
