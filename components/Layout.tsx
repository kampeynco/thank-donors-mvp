
import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Mail, Settings, LogOut, Heart, ChevronDown, PlusCircle, Check, Users, ChevronLeft, User, CreditCard } from 'lucide-react';
import { ViewState, ActBlueAccount } from '../types';

interface LayoutProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onLogout: () => void;
  children: React.ReactNode;
  accounts: ActBlueAccount[];
  currentAccount: ActBlueAccount | null;
  onSwitchAccount: (account: ActBlueAccount) => void;
  onAddAccount: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  currentView, 
  onChangeView, 
  onLogout, 
  children,
  accounts,
  currentAccount,
  onSwitchAccount,
  onAddAccount
}) => {
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isMobileAccountsExpanded, setIsMobileAccountsExpanded] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: ViewState.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: ViewState.POSTCARD_BUILDER, label: 'Design', icon: Mail },
    { id: ViewState.BILLING, label: 'Billing', icon: CreditCard },
    { id: ViewState.SETTINGS, label: 'Settings', icon: Settings },
  ];

  // Desktop: Show all nav items in the top bar
  const topLevelNavItems = navItems;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false);
        setIsMobileAccountsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
      setIsAccountDropdownOpen(false);
      setIsMobileAccountsExpanded(false);
      setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
      setIsLogoutModalOpen(false);
      onLogout();
  };

  // Helper for rendering account list items to avoid duplication
  const AccountListItems = () => (
    <>
      {accounts.map(account => (
          <button
              key={account.id}
              onClick={() => {
                  onSwitchAccount(account);
                  setIsAccountDropdownOpen(false);
                  setIsMobileAccountsExpanded(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-stone-50 flex items-center justify-between group/item transition-colors"
          >
              <span className={`text-sm truncate ${currentAccount?.id === account.id ? 'font-bold text-stone-800' : 'font-medium text-stone-600'}`}>
                  {account.committee_name}
              </span>
              {currentAccount?.id === account.id && <Check size={14} className="text-rose-500 shrink-0" />}
          </button>
      ))}
      <div className="border-t border-stone-100 my-1"></div>
      <button
          onClick={() => {
              onAddAccount();
              setIsAccountDropdownOpen(false);
              setIsMobileAccountsExpanded(false);
          }}
          className="w-full text-left px-4 py-2 hover:bg-stone-50 flex items-center gap-2 text-rose-600 text-xs font-bold transition-colors"
      >
          <PlusCircle size={14} />
          Add New Account
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-stone-50 font-sans flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            {/* Left: Logo */}
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => onChangeView(ViewState.DASHBOARD)}>
              <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-md shadow-rose-200">
                <Heart size={16} fill="currentColor" />
              </div>
              <div className="hidden md:block">
                <h1 className="font-serif font-bold text-lg text-stone-800 leading-none">Thank Donors</h1>
                <p className="text-[10px] text-stone-500 font-medium">Automated Gratitude</p>
              </div>
            </div>

            {/* Right: Nav & Account */}
            <div className="flex items-center gap-4">
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-2">
                  {topLevelNavItems.map((item) => (
                      <button
                          key={item.id}
                          onClick={() => onChangeView(item.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              currentView === item.id
                              ? 'bg-rose-50 text-rose-700'
                              : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                          }`}
                      >
                          <item.icon size={16} />
                          {item.label}
                      </button>
                  ))}
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-stone-200 hidden md:block mx-2"></div>

              {/* Account Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button 
                    onClick={() => {
                        setIsAccountDropdownOpen(!isAccountDropdownOpen);
                        setIsMobileAccountsExpanded(false);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors group"
                >
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Campaign</p>
                        <p className="text-sm font-bold text-stone-800 leading-none max-w-[150px] truncate">
                            {currentAccount?.committee_name || 'Select Account'}
                        </p>
                    </div>
                    <ChevronDown size={16} className={`text-stone-400 transition-transform ${isAccountDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isAccountDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-stone-100 z-50 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto md:overflow-visible md:max-h-none custom-scrollbar">
                        
                        {/* Active Account Info (Mobile Visible) */}
                        <div className="px-4 py-3 bg-stone-50 border-b border-stone-100 sm:hidden rounded-t-xl">
                            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-0.5">Active Campaign</p>
                            <p className="text-sm font-bold text-stone-800 truncate">{currentAccount?.committee_name}</p>
                        </div>

                        {/* Navigation Menu */}
                        <div className="py-2">
                            
                            {/* Mobile Only: Navigation Section */}
                            <div className="md:hidden">
                                <div className="px-4 pb-2 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                                    Navigation
                                </div>
                                
                                {topLevelNavItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            onChangeView(item.id);
                                            setIsAccountDropdownOpen(false);
                                            setIsMobileAccountsExpanded(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors ${
                                            currentView === item.id
                                            ? 'bg-rose-50 text-rose-700 border-r-2 border-rose-500'
                                            : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                                        }`}
                                    >
                                        <item.icon size={16} />
                                        {item.label}
                                    </button>
                                ))}
                                <div className="border-t border-stone-100 my-2"></div>
                            </div>

                            {/* Account Actions Section */}
                            <div className="px-4 pb-2 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                                Account Actions
                            </div>

                            {/* Switch Accounts Container */}
                            <div className="relative group">
                                <button 
                                    onClick={() => setIsMobileAccountsExpanded(!isMobileAccountsExpanded)}
                                    className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Users size={16} />
                                        Switch Accounts
                                    </div>
                                    {/* Desktop Arrow (Left for Submenu) */}
                                    <ChevronLeft size={16} className="text-stone-400 hidden md:block" />
                                    {/* Mobile Arrow (Down for Accordion) */}
                                    <ChevronDown size={16} className={`text-stone-400 md:hidden transition-transform ${isMobileAccountsExpanded ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {/* Desktop Submenu (Hover) */}
                                <div className="hidden md:group-hover:block absolute right-full top-0 w-64 bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden z-50">
                                    <div className="py-2">
                                        <div className="px-4 pb-2 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                                            Select Campaign
                                        </div>
                                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                            <AccountListItems />
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Accordion List (Inline) */}
                                <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out bg-stone-50/50 ${isMobileAccountsExpanded ? 'max-h-80 opacity-100 border-y border-stone-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="py-2">
                                        <AccountListItems />
                                    </div>
                                </div>
                            </div>

                            {/* My Profile Item */}
                            <button
                                onClick={() => {
                                    onChangeView(ViewState.PROFILE);
                                    setIsAccountDropdownOpen(false);
                                    setIsMobileAccountsExpanded(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors ${
                                    currentView === ViewState.PROFILE
                                    ? 'bg-rose-50 text-rose-700 border-r-2 border-rose-500'
                                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                                }`}
                            >
                                <User size={16} />
                                My Profile
                            </button>

                        </div>

                        <div className="border-t border-stone-100 my-1"></div>

                        {/* Logout */}
                        <button
                            onClick={handleLogoutClick}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-stone-500 hover:text-rose-600 hover:bg-rose-50 transition-colors rounded-b-xl"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
                  <h3 className="text-xl font-bold text-stone-800 mb-2">Are you sure you want to log out?</h3>
                  <p className="text-stone-500 mb-6">You will need to sign in again to access your account.</p>
                  
                  <div className="flex gap-3">
                      <button 
                          onClick={() => setIsLogoutModalOpen(false)}
                          className="flex-1 py-2.5 rounded-xl font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={confirmLogout}
                          className="flex-1 py-2.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200"
                      >
                          Confirm
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Layout;
