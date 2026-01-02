import React, { useState, useRef, useEffect } from 'react';
import { ViewState, Donation, ActBlueAccount } from '../types';
import {
  CheckCircle2, Clock, AlertCircle, TrendingUp, ChevronDown, ExternalLink,
  Activity, Search, X, RotateCcw, Loader2, CreditCard, MapPin,
  RefreshCw, Mail, ArrowRight, HandCoins, ArrowUpRight
} from 'lucide-react';
import StatusTooltip from './StatusTooltip';
import PostcardTrackingCard from './PostcardTrackingCard';
import AddressModal from './AddressModal';
import { supabase } from '../services/supabaseClient';
import { useToast } from './ToastContext';

interface DashboardProps {
  donations: Donation[];
  onRefresh?: () => void;
  onNavigate?: (view: ViewState, section?: string) => void;
  currentAccount?: ActBlueAccount | null;
}

const Dashboard: React.FC<DashboardProps> = ({ donations, onRefresh, onNavigate, currentAccount }) => {
  const { toast } = useToast();
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [selectedDonationId, setSelectedDonationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [addressModalDonation, setAddressModalDonation] = useState<Donation | null>(null);
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

  const isBalanceError = (donation: Donation) =>
    donation.status === 'failed' &&
    (donation.error_message?.toLowerCase().includes('balance') ||
      donation.error_message?.toLowerCase().includes('funds') ||
      donation.error_message?.toLowerCase().includes('credit'));

  const isAddressError = (donation: Donation) =>
    donation.status === 'failed' &&
    (donation.error_message?.toLowerCase().includes('address') ||
      donation.error_message?.toLowerCase().includes('zip') ||
      donation.error_message?.toLowerCase().includes('city'));

  const handleRetryPostcard = async (address?: any, donationId?: string) => {
    const idToRetry = donationId || (addressModalDonation ? addressModalDonation.id : null);
    if (!idToRetry) return;

    // Close modal if open
    setAddressModalDonation(null);

    if (retryingId) return;

    setRetryingId(idToRetry);

    try {
      const { data, error } = await supabase.functions.invoke('retry-postcard', {
        body: { donationId: idToRetry, address }
      });

      if (error) throw error;

      if (data.success) {
        toast("Postcard sent successfully!", "success");
        onRefresh?.();
      } else {
        toast(`Retry failed: ${data.error}`, "error");
      }
    } catch (err: any) {
      console.error("Retry failed:", err);
      toast(`Retry failed: ${err.message}`, "error");
    } finally {
      setRetryingId(null);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleViewProof = (url: string) => {
    return url;
  };

  const stats = [
    {
      label: 'Total Raised',
      value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalRaised),
      change: 'Total',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      label: 'Postcards Sent',
      value: sentCount.toString(),
      change: 'Delivered',
      trend: 'up',
      icon: CheckCircle2,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: 'Pending',
      value: pendingCount.toString(),
      change: 'Processing',
      trend: 'neutral',
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-sans">
            Welcome back{currentAccount ? `, ${currentAccount.committee_name}` : ''}
          </h1>
          <p className="text-slate-500 mt-1">Here's what's happening with your donor engagement today.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            Status
          </span>
          <button
            onClick={onRefresh}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon size={24} />
              </div>
              <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${stat.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                }`}>
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-slate-900 font-sans tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Recent Activity</h2>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search donors..."
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter */}
            <div className="flex-shrink-0">
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border-slate-200 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg bg-white text-slate-900"
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
        </div>

        {/* Activity Feed Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase">Donor</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDonations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Activity className="w-12 h-12 text-slate-100 mb-4" />
                      <p className="text-slate-400 text-sm">
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
                    className={`transition-colors group ${donation.status === 'failed'
                      ? 'cursor-default'
                      : `cursor-pointer hover:bg-slate-50 ${selectedDonationId === donation.id ? 'bg-blue-50/50' : ''}`
                      }`}
                    onClick={() => {
                      if (donation.status === 'failed') return;
                      setSelectedDonationId(
                        selectedDonationId === donation.id ? null : donation.id
                      );
                    }}
                  >
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {new Date(donation.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-slate-800">
                      {donation.donor_firstname} {donation.donor_lastname}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">${donation.amount.toFixed(2)}</td>
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
                      <div className="flex items-center justify-end gap-3 transition-all">
                        {['failed', 'returned_to_sender'].includes(donation.status) && (
                          <div className="flex items-center gap-3">
                            {isBalanceError(donation) ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigate?.(ViewState.SETTINGS, 'billing');
                                }}
                                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline uppercase tracking-tight whitespace-nowrap"
                              >
                                Add Balance
                              </button>
                            ) : isAddressError(donation) ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAddressModalDonation(donation);
                                }}
                                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline uppercase tracking-tight whitespace-nowrap"
                              >
                                Fix Address
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRetryPostcard(null, donation.id);
                                }}
                                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline uppercase tracking-tight whitespace-nowrap"
                              >
                                Retry
                              </button>
                            )}
                            {retryingId === donation.id && (
                              <Loader2 size={14} className="animate-spin text-slate-400" />
                            )}
                          </div>
                        )}

                        {(['processed', 'mailed', 'in_transit', 'in_local_area', 'processed_for_delivery', 'delivered'].includes(donation.status) && donation.lob_url) && (
                          <a
                            href={handleViewProof(donation.lob_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-slate-400 hover:text-blue-600 transition-colors"
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
              // Pass null for address to signify simple retry
              onRetry={() => handleRetryPostcard(null, selectedDonation.id)}
              onUpdateAddress={() => setAddressModalDonation(selectedDonation)}
              onNavigate={onNavigate}
              isRetrying={retryingId === selectedDonation.id}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">
            <p>Select a donation to view details</p>
          </div>
        )}
      </div>

      {addressModalDonation && (
        <AddressModal
          isOpen={!!addressModalDonation}
          onClose={() => setAddressModalDonation(null)}
          currentAddress={{
            address_line1: addressModalDonation.address_street,
            address_city: addressModalDonation.address_city,
            address_state: addressModalDonation.address_state,
            address_zip: addressModalDonation.address_zip
          }}
          onSave={(address) => handleRetryPostcard(address, addressModalDonation.id)}
        />
      )}
    </div>
  );
};

export default Dashboard;