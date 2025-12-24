import React, { useState, useRef, useEffect } from 'react';
import { Donation } from '../types';
import { CheckCircle2, Clock, AlertCircle, TrendingUp, ChevronDown, ExternalLink, Activity, Search, X } from 'lucide-react';
import StatusTooltip from './StatusTooltip';
import PostcardTrackingCard from './PostcardTrackingCard';

interface DashboardProps {
  donations: Donation[];
}

const Dashboard: React.FC<DashboardProps> = ({ donations }) => {
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [selectedDonationId, setSelectedDonationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const filteredDonations = donations.filter(donation => {
    const matchesSearch =
      donation.donor_firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.donor_lastname.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'sent') {
      matchesStatus = ['processed', 'mailed', 'in_transit', 'in_local_area', 'processed_for_delivery', 'delivered'].includes(donation.status);
    } else if (statusFilter === 'pending') {
      matchesStatus = ['pending', 'processing'].includes(donation.status);
    } else if (statusFilter === 'failed') {
      matchesStatus = ['failed', 'returned_to_sender'].includes(donation.status);
    }

    return matchesSearch && matchesStatus;
  });

  const selectedDonation = donations.find(d => d.id === selectedDonationId);

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
    <div className="relative min-h-[calc(100vh-theme(spacing.24))]">
      {/* Main Content Area - shifts when panel is open */}
      <div
        className={`transition-all duration-300 ease-in-out ${selectedDonationId ? 'mr-0 lg:mr-[400px]' : ''
          }`}
      >
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


          {/* Search and Filter Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-4 flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="text-stone-400 w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Search donors..."
                className="block w-full pl-10 pr-3 py-2 border border-stone-200 rounded-lg leading-5 bg-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-stone-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex-shrink-0">
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border-stone-200 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-lg bg-white text-stone-900"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="sent">Sent</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
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
                  {filteredDonations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Activity className="w-12 h-12 text-stone-100 mb-4" />
                          <p className="text-stone-400 text-sm">
                            {searchTerm || statusFilter !== 'all'
                              ? "No donations found matching your filters."
                              : "Waiting for your first donation..."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDonations.map((donation) => (
                      <tr
                        key={donation.id}
                        className={`hover:bg-stone-50 transition-colors cursor-pointer group ${selectedDonationId === donation.id ? 'bg-indigo-50/50' : ''
                          }`}
                        onClick={() => setSelectedDonationId(
                          selectedDonationId === donation.id ? null : donation.id
                        )}
                      >
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
                            <StatusTooltip content={donation.error_message} position="left">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 cursor-help">
                                {donation.status === 'failed' ? 'Failed' : 'Returned'}
                              </span>
                            </StatusTooltip>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            {donation.lob_url && (
                              <a
                                href={donation.lob_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 hover:bg-stone-100 rounded-lg text-rose-600 transition-colors"
                                title="View Proof"
                              >
                                <ExternalLink size={16} />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Sliding Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${selectedDonationId ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {selectedDonation ? (
          <div className="h-full pt-4">
            <PostcardTrackingCard
              donation={selectedDonation}
              onClose={() => setSelectedDonationId(null)}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-8 text-center text-stone-400">
            <p>No donation selected</p>
          </div>
        )}
      </div>

      {/* Backdrop for mobile */}
      {selectedDonationId && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          onClick={() => setSelectedDonationId(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;