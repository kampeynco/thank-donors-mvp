import React, { useState, useRef, useEffect } from 'react';
import { Donation } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle2, Clock, AlertCircle, TrendingUp, ChevronDown, ExternalLink } from 'lucide-react';

interface DashboardProps {
  donations: Donation[];
}

const Dashboard: React.FC<DashboardProps> = ({ donations }) => {
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Calculate Stats
  const sentCount = donations.filter(d => ['processed', 'mailed', 'in_transit', 'in_local_area', 'processed_for_delivery', 'delivered'].includes(d.status)).length;
  const pendingCount = donations.filter(d => ['pending', 'processing'].includes(d.status)).length;
  const failedCount = donations.filter(d => ['failed', 'returned_to_sender'].includes(d.status)).length;
  const totalRaised = donations.reduce((acc, curr) => acc + curr.amount, 0);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        <div className="relative" ref={statusDropdownRef}>
          <button
            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors cursor-pointer gap-1"
          >
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Status
            <ChevronDown size={12} className={`transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isStatusDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-stone-100 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
              <div className="p-4">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Status Legend</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-bold text-stone-800">Live</p>
                      <p className="text-xs text-stone-500">All systems operational</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-bold text-stone-800">System Issues</p>
                      <p className="text-xs text-stone-500">Partial service disruption</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-bold text-stone-800">System Down</p>
                      <p className="text-xs text-stone-500">Service unavailable</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
                  <th className="text-right py-3 px-6 text-xs font-semibold text-stone-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {donations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-400 text-sm">No donations found.</td>
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
                        {['delivered'].includes(donation.status) && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            Delivered
                          </span>
                        )}
                        {['processed', 'mailed', 'in_transit', 'in_local_area', 'processed_for_delivery'].includes(donation.status) && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {donation.status.replace(/_/g, ' ')}
                          </span>
                        )}
                        {['pending', 'processing'].includes(donation.status) && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                          </span>
                        )}
                        {['failed', 'returned_to_sender'].includes(donation.status) && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 cursor-help" title={donation.error_message}>
                            {donation.status === 'failed' ? 'Failed' : 'Returned'}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {donation.lob_url && (
                          <a
                            href={donation.lob_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-rose-600 hover:text-rose-700 font-medium text-sm transition-colors"
                          >
                            View <ExternalLink size={14} />
                          </a>
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
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a8a29e', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a8a29e', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#fff1f2' }}
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