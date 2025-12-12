import React from 'react';
import { Donation } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react';

interface DashboardProps {
  donations: Donation[];
}

const Dashboard: React.FC<DashboardProps> = ({ donations }) => {
  // Calculate Stats
  const sentCount = donations.filter(d => d.status === 'SENT').length;
  const pendingCount = donations.filter(d => d.status === 'PENDING').length;
  const failedCount = donations.filter(d => d.status === 'FAILED').length;
  const totalRaised = donations.reduce((acc, curr) => acc + curr.amount, 0);

  // Mock data for the chart
  const chartData = [
    { name: 'Mon', sent: 4 },
    { name: 'Tue', sent: 7 },
    { name: 'Wed', sent: 3 },
    { name: 'Thu', sent: 12 },
    { name: 'Fri', sent: 8 },
    { name: 'Sat', sent: 15 },
    { name: 'Sun', sent: 10 },
  ];

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-stone-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-stone-800">{value}</h3>
        {subtext && <p className="text-xs text-stone-400 mt-2">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-stone-800">Campaign Overview</h2>
          <p className="text-stone-500 mt-2">Welcome back! Here's how your gratitude campaign is performing.</p>
        </div>
        <div className="flex gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                <span className="w-2 h-2 mr-2 bg-emerald-500 rounded-full animate-pulse"></span>
                System Operational
            </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Postcards Sent" 
          value={sentCount} 
          icon={CheckCircle2} 
          color="bg-emerald-100 text-emerald-600" 
          subtext="Total delivered"
        />
        <StatCard 
          title="Pending" 
          value={pendingCount} 
          icon={Clock} 
          color="bg-amber-100 text-amber-600" 
          subtext="In queue"
        />
        <StatCard 
          title="Failed" 
          value={failedCount} 
          icon={AlertCircle} 
          color="bg-rose-100 text-rose-600" 
          subtext="Requires attention"
        />
        <StatCard 
          title="Total Raised" 
          value={`$${totalRaised.toLocaleString()}`} 
          icon={TrendingUp} 
          color="bg-blue-100 text-blue-600" 
          subtext="From tracked donations"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-stone-100">
            <h3 className="font-bold text-lg text-stone-800">Recent Activity</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50">
                <tr>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-stone-500 uppercase">Date</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-stone-500 uppercase">Donor</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-stone-500 uppercase">Amount</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-stone-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {donations.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="py-8 text-center text-stone-400 text-sm">No donations found.</td>
                    </tr>
                ) : (
                    donations.map((donation) => (
                    <tr key={donation.id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-4 px-6 text-sm text-stone-600">
                        {new Date(donation.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6 text-sm font-medium text-stone-800">
                          {donation.donor_firstname} {donation.donor_lastname}
                        </td>
                        <td className="py-4 px-6 text-sm text-stone-600">${donation.amount.toFixed(2)}</td>
                        <td className="py-4 px-6">
                        {donation.status === 'SENT' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            Sent
                            </span>
                        )}
                        {donation.status === 'PENDING' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Pending
                            </span>
                        )}
                        {donation.status === 'FAILED' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 cursor-help" title={donation.error_message}>
                            Failed
                            </span>
                        )}
                        </td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 flex flex-col">
          <h3 className="font-bold text-lg text-stone-800 mb-6">Volume Sent</h3>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 12}} />
                <Tooltip 
                    cursor={{fill: '#fff1f2'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="sent" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;