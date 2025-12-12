
import React from 'react';
import { CreditCard, DollarSign, Clock } from 'lucide-react';

const BillingView: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-serif font-bold text-stone-800">Manage Billing</h2>
        <p className="text-stone-500 mt-2">Update payment methods and view transaction history.</p>
      </div>

      {/* Billing Card */}
      <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-8 text-white shadow-lg shadow-rose-200">
          <h3 className="font-bold flex items-center gap-2 mb-4">
              <CreditCard size={20} />
              Billing Method
          </h3>
          <div className="bg-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium opacity-80">Current Card</span>
                      <span className="bg-white text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded">Active</span>
              </div>
              <div className="font-mono text-lg tracking-wider">•••• •••• •••• 4242</div>
          </div>
          
          <div className="space-y-2 text-sm opacity-90 mb-6">
              <div className="flex justify-between">
                  <span>Cost per Postcard</span>
                  <span className="font-bold">$0.99</span>
              </div>
              <div className="flex justify-between">
                  <span>Billing Cycle</span>
                  <span className="font-bold">Weekly</span>
              </div>
          </div>

          <button type="button" className="w-full bg-white text-rose-600 font-bold py-3 rounded-xl hover:bg-rose-50 transition-colors">
              Update Payment Method
          </button>
      </div>

      {/* Payment History Placeholder */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-stone-800 flex items-center gap-2">
            <Clock size={20} className="text-stone-400" />
            Payment History
          </h3>
          <button className="text-sm text-rose-600 font-medium hover:underline">Download All</button>
        </div>
        <div className="divide-y divide-stone-100">
            {/* Mock History Items */}
            {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="bg-stone-100 p-2 rounded-lg text-stone-500">
                            <DollarSign size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-stone-800 text-sm">Weekly Usage Charge</p>
                            <p className="text-xs text-stone-500">Oct {10 - i}, 2023 • Visa •••• 4242</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-stone-800 text-sm">-$24.75</p>
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Paid</span>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default BillingView;
