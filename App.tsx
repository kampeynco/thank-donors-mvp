import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { ViewState, Profile, ActBlueAccount, Donation, PostcardEvent } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PostcardBuilder from './components/PostcardBuilder';
import ActBlueConnect from './components/ActBlueConnect';
import UserOnboarding from './components/UserOnboarding';
import Settings from './components/Settings';
import ProfileView from './components/ProfileView';
import BillingView from './components/BillingView';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import PricingPage from './components/PricingPage';
import AccountLayout from './components/AccountLayout';
import SubscriptionFlow from './components/SubscriptionFlow';
import { supabase } from './services/supabaseClient';
import { Loader2, Home, Sparkles, AlertTriangle, Lock, User, Webhook, FileText, CreditCard } from 'lucide-react';
import { useToast, ToastProvider } from './components/ToastContext';

// --- Protected Layout Wrapper ---
const ProtectedLayout: React.FC<{
  children: React.ReactNode;
  profile: Profile | null;
  accounts: ActBlueAccount[];
  currentAccount: ActBlueAccount | null;
  onLogout: () => void;
  onSwitchAccount: (a: ActBlueAccount) => void;
  onAddAccount: () => void;
  onNavigate: (view: ViewState) => void;
  currentView: ViewState;
  settingsActiveSection?: string;
  setSettingsActiveSection?: (s: string) => void;
  profileActiveSection?: string;
  setProfileActiveSection?: (s: string) => void;
}> = ({
  children, profile, accounts, currentAccount, onLogout, onSwitchAccount, onAddAccount,
  currentView, onNavigate, settingsActiveSection, setSettingsActiveSection, profileActiveSection, setProfileActiveSection
}) => {
    if (!profile) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50">
          <Loader2 className="animate-spin text-rose-600" size={32} />
        </div>
      );
    }

    return (
      <Layout
        currentView={currentView}
        onChangeView={onNavigate}
        onLogout={onLogout}
        accounts={accounts}
        currentAccount={currentAccount}
        onSwitchAccount={onSwitchAccount}
        onAddAccount={onAddAccount}
        subNavigation={currentView === ViewState.SETTINGS && setSettingsActiveSection ? {
          items: [
            { id: 'general', label: 'General Information', icon: Home },
            { id: 'webhook', label: 'Webhook Details', icon: Webhook },
            { id: 'disclaimer', label: 'Disclaimer', icon: FileText },
            { id: 'branding', label: 'Branding', icon: Sparkles },
            { id: 'billing', label: 'Billing', icon: CreditCard },
            { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
          ],
          activeId: settingsActiveSection || 'general',
          onSelect: setSettingsActiveSection
        } : currentView === ViewState.PROFILE && setProfileActiveSection ? {
          items: [
            { id: 'profile', label: 'User Information', icon: User },
            { id: 'security', label: 'Security', icon: Lock },
            { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
          ],
          activeId: profileActiveSection || 'profile',
          onSelect: setProfileActiveSection
        } : undefined}
      >
        {children}
      </Layout>
    );
  };

const AppContent: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentViewFromLocation = (): ViewState => {
    const p = location.pathname;
    if (p.includes('/dashboard')) return ViewState.DASHBOARD;
    if (p.includes('/settings')) return ViewState.SETTINGS;
    if (p.includes('/postcards')) return ViewState.POSTCARD_BUILDER;
    if (p.includes('/pending-entity')) return ViewState.ACTBLUE_CONNECT;
    if (p.includes('/create-profile')) return ViewState.USER_ONBOARDING;
    if (p.includes('/pricing')) return ViewState.PRICING_PAGE;
    if (p.includes('/auth')) return ViewState.AUTH;
    if (p.includes('/profile')) return ViewState.PROFILE;
    return ViewState.LANDING_PAGE;
  };
  const currentView = getCurrentViewFromLocation();

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const loadedUserIdRef = React.useRef<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [accounts, setAccounts] = useState<ActBlueAccount[]>([]);
  const [currentAccount, setCurrentAccount] = useState<ActBlueAccount | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);

  // Sub-navigation states
  const [settingsActiveSection, setSettingsActiveSection] = useState('general');
  const [profileActiveSection, setProfileActiveSection] = useState('profile');

  const sessionRef = React.useRef(session);
  const loadingRef = React.useRef(loading);

  useEffect(() => {
    sessionRef.current = session;
    loadingRef.current = loading;
  }, [session, loading]);

  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (loadingRef.current) {
        console.warn("Loading timed out.");
        setLoading(false);
      }
    }, 5000);

    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(session);
        if (session) {
          await fetchData(session.user.id, session.user.email);
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error("Auth failed:", e);
        setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthStateChange:', event, session?.user?.id);
      setSession(session);

      if (event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') return;

      if (event === 'SIGNED_IN' && session?.user?.id) {
        if (loadedUserIdRef.current === session.user.id) return;
        fetchData(session.user.id, session.user.email);
      }

      if (event === 'SIGNED_OUT') {
        loadedUserIdRef.current = null;
        setProfile(null);
        setAccounts([]);
        setCurrentAccount(null);
        setDonations([]);
        navigate('/');
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  const fetchData = async (userId: string, userEmail?: string) => {
    setLoading(true);
    loadedUserIdRef.current = userId;
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true });

      if (upsertError) console.warn('Profile upsert notice:', upsertError.message);

      const { data: loadedProfileData, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchErr) throw fetchErr;

      const mappedProfile = { ...loadedProfileData };
      mappedProfile.email = userEmail;

      if (user && user.user_metadata) {
        mappedProfile.full_name = mappedProfile.full_name || user.user_metadata.full_name;
        mappedProfile.organization = mappedProfile.organization || user.user_metadata.organization;
        mappedProfile.job_title = mappedProfile.job_title || user.user_metadata.job_title;
      }

      setProfile(mappedProfile);

      let fetchedAccounts: ActBlueAccount[] = [];
      const { data: accountsData, error: accountsError } = await supabase
        .from('actblue_accounts')
        .select('*, entity:actblue_entities(*)')
        .eq('profile_id', userId)
        .order('committee_name');

      if (!accountsError && accountsData) {
        fetchedAccounts = (accountsData as any[]).map(row => {
          const entityProp = row.entity || {};
          return {
            ...row,
            is_using_entity_image: !row.front_image_url && !!entityProp.front_image_url,
            is_using_entity_message: !row.back_message && !!entityProp.back_message,
            is_using_entity_disclaimer: !row.disclaimer && !!entityProp.disclaimer,
            front_image_url: row.front_image_url || entityProp.front_image_url,
            back_message: row.back_message || entityProp.back_message,
            disclaimer: row.disclaimer || entityProp.disclaimer,
          };
        }) as ActBlueAccount[];
      }
      setAccounts(fetchedAccounts);

      const isUserProfileComplete = mappedProfile.full_name && mappedProfile.organization;
      if (!isUserProfileComplete) {
        if (location.pathname !== '/create-profile') {
          navigate('/create-profile');
        }
      } else if (fetchedAccounts.length === 0) {
        if (location.pathname !== '/pending-entity') {
          navigate('/pending-entity');
        }
      } else {
        if (location.pathname === '/' || location.pathname === '/auth') {
          navigate('/dashboard');
        }
      }

    } catch (error: any) {
      console.error('Error loading data:', error);
      toast(`Failed to load data: ${error.message} `, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDonations = async (userId: string, accountId?: string) => {
    try {
      let query = supabase
        .from('donations')
        .select(`
          id, donor_firstname, donor_lastname, amount, created_at,
          donor_addr1, donor_city, donor_state, donor_zip,
          postcards(
            id, status, error_message, lob_url, lob_postcard_id,
            front_image_url, back_message, updated_at, created_at,
            postcard_events(id, status, description, created_at)
          )
        `)
        .eq('profile_id', userId)
        .order('created_at', { ascending: false });

      if (accountId) {
        query = query.eq('actblue_account_id', accountId);
      }

      const { data: donationData, error: donationError } = await query;

      if (!donationError) {
        const mappedDonations: Donation[] = (donationData || []).map((d: any) => {
          const postcard = d.postcards?.[0];
          return {
            id: d.id,
            donor_firstname: d.donor_firstname,
            donor_lastname: d.donor_lastname,
            amount: d.amount,
            created_at: d.created_at,
            status: postcard?.status || 'pending',
            error_message: postcard?.error_message,
            lob_url: postcard?.lob_url,
            lob_postcard_id: postcard?.lob_postcard_id,
            address_street: d.donor_addr1,
            address_city: d.donor_city,
            address_state: d.donor_state,
            address_zip: d.donor_zip,
            front_image_url: postcard?.front_image_url,
            back_message: postcard?.back_message,
            events: postcard?.postcard_events || [],
            updated_at: postcard?.updated_at || postcard?.created_at
          };
        });
        setDonations(mappedDonations);
      }
    } catch (donErr) {
      console.error("Donation fetch exception:", donErr);
    }
  };

  useEffect(() => {
    if (!session?.user?.id) return;
    const channel = supabase.channel('dashboard_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'donations', filter: `profile_id=eq.${session.user.id}` },
        async (payload) => {
          if (currentAccount) fetchDonations(session.user.id, currentAccount.id);
          toast(`New donation received!`, 'success');
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'postcards', filter: `profile_id=eq.${session.user.id}` },
        async (payload) => {
          if (currentAccount) fetchDonations(session.user.id, currentAccount.id);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session?.user?.id, currentAccount?.id]);

  const handleUpdateProfile = async (updatedFields: Partial<Profile>) => {
    if (!profile || !session) return;
    const { email, full_name, organization, job_title, ...profileTableFields } = updatedFields;
    try {
      if (Object.keys(profileTableFields).length > 0) {
        await supabase.from('profiles').update(profileTableFields).eq('id', session.user.id);
      }
      if (full_name !== undefined || organization !== undefined || job_title !== undefined) {
        await supabase.auth.updateUser({ data: { full_name, organization, job_title } });
      }
      setProfile(prev => prev ? { ...prev, ...updatedFields } : null);
      toast("Profile updated successfully", "success");
    } catch (e: any) {
      toast(`Error: ${e.message}`, 'error');
    }
  };

  const handleSaveAccount = async (accountData: Partial<ActBlueAccount>) => {
    if (!session || !profile) return;
    try {
      if (currentAccount && currentAccount.id !== 'new') {
        const updates: any = { ...accountData };
        if (updates.entity_id) updates.entity_id = Number(updates.entity_id);
        await supabase.from('actblue_entities').update(updates).eq('entity_id', currentAccount.entity_id);

        const updated = { ...currentAccount, ...accountData } as ActBlueAccount;
        if (accountData.entity_id) updated.entity_id = Number(accountData.entity_id);
        if (currentAccount.entity) updated.entity = { ...currentAccount.entity, ...accountData as any };

        setCurrentAccount(updated);
        setAccounts(prev => prev.map(a => a.id === updated.id ? updated : a));
        toast("Account details saved", "success");
      } else {
        const entityId = Number(accountData.entity_id) || 0;
        const committeeName = accountData.committee_name || 'My Campaign';
        if (entityId === 0) throw new Error("Valid Entity ID required");
        toast("Provisioning webhook...", "info");

        const { data: hookdeckData, error } = await supabase.functions.invoke('connect-hookdeck', {
          body: {
            committee_name: committeeName,
            entity_id: entityId,
            profile_id: session.user.id,
            disclaimer: accountData.disclaimer,
            front_image_url: accountData.front_image_url,
            back_message: accountData.back_message
          }
        });
        if (error) throw error;
        if (!hookdeckData?.account?.id) throw new Error("Invalid response");

        const createdAccount = hookdeckData.account;
        setAccounts(prev => [createdAccount, ...prev]);
        // Navigate to the new account checkout flow!
        navigate(`/entities/${createdAccount.entity_id}/checkout`);
        toast("New account created!", "success");
      }
    } catch (e: any) {
      toast(`Error saving account: ${e.message}`, 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentAccount) return;
    try {
      await supabase.functions.invoke('delete-actblue-account', { body: { account_id: currentAccount.id } });
      const remaining = accounts.filter(a => a.id !== currentAccount.id);
      setAccounts(remaining);
      toast("Account deleted", "info");
      if (remaining.length > 0) {
        navigate(`/entities/${remaining[0].entity_id}/dashboard`);
      } else {
        navigate('/pending-entity');
      }
    } catch (e: any) {
      toast(`Failed to delete: ${e.message}`, 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!session?.user?.id) return;
    try {
      await supabase.from('profiles').delete().eq('id', session.user.id);
      await supabase.auth.signOut();
      navigate('/');
      toast("User account deleted", "info");
    } catch (e: any) {
      toast(`Delete failed: ${e.message}`, 'error');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setAccounts([]);
    navigate('/');
    toast("Logged out", "info");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-rose-600" size={40} /></div>;
  }

  // --- Views Helpers ---
  // We need to pass "onSwitchAccount" that actually Navigates.
  const handleSwitchAccount = (account: ActBlueAccount) => {
    navigate(`/entities/${account.entity_id}/dashboard`);
  };

  const handleAddAccountReq = () => {
    navigate('/pending-entity');
  };

  // Maps Sidebar ViewState to URL navigation
  const handleLayoutNavigate = (view: ViewState) => {
    if (!currentAccount) {
      if (view === ViewState.PROFILE) navigate('/profile');
      return;
    }

    const baseEntityId = currentAccount.entity_id;
    const basePath = `/entities/${baseEntityId}`;

    switch (view) {
      case ViewState.DASHBOARD:
        navigate(`${basePath}/dashboard`);
        break;
      case ViewState.POSTCARD_BUILDER:
        navigate(`${basePath}/postcards`);
        break;
      case ViewState.SETTINGS:
        navigate(`${basePath}/settings`);
        break;
      case ViewState.PROFILE:
        navigate(`/profile`);
        break;
      default:
        navigate(`${basePath}/dashboard`);
    }
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage onLogin={() => navigate('/auth')} onSignup={() => navigate('/auth')} onPricingClick={() => navigate('/pricing')} />} />
      <Route path="/auth" element={<Auth onLogin={() => navigate('/dashboard')} />} />
      <Route path="/pricing" element={<PricingPage onLogin={() => navigate('/auth')} onSignup={() => navigate('/auth')} onBack={() => navigate('/')} />} />

      {/* Root Dashboard Redirect */}
      <Route path="/dashboard" element={
        accounts.length > 0 ? <Navigate to={`/entities/${accounts[0].entity_id}/dashboard`} replace /> : <Navigate to="/pending-entity" replace />
      } />

      {/* Account Context Routes */}
      <Route path="/entities/:entityId" element={
        <ProtectedLayout
          profile={profile} accounts={accounts} currentAccount={currentAccount}
          onLogout={handleLogout} onSwitchAccount={handleSwitchAccount} onAddAccount={handleAddAccountReq}
          currentView={currentView}
          onNavigate={handleLayoutNavigate} // Pass the handler!
          settingsActiveSection={settingsActiveSection}
          setSettingsActiveSection={setSettingsActiveSection}
          profileActiveSection={profileActiveSection}
          setProfileActiveSection={setProfileActiveSection}
        >
          <AccountLayout accounts={accounts} currentAccount={currentAccount} onSwitchAccount={(a) => setCurrentAccount(a)} isLoading={loading} />
        </ProtectedLayout>
      }>
        <Route path="dashboard" element={
          <Dashboard
            donations={donations}
            onRefresh={() => profile && currentAccount && fetchDonations(profile.id, currentAccount.id)}
            onNavigate={(v, s) => { if (v === ViewState.SETTINGS) navigate(`../settings`); }}
            currentAccount={currentAccount}
          />
        } />
        <Route path="settings" element={
          <Settings
            profile={profile!} currentAccount={currentAccount}
            activeSection={settingsActiveSection} setActiveSection={setSettingsActiveSection}
            onUpdate={handleUpdateProfile} onDeleteAccount={handleDeleteAccount} onSaveAccount={handleSaveAccount}
            onUpdateEntity={async (u) => { /* internal */ }}
          />
        } />
        <Route path="postcards" element={
          <PostcardBuilder
            currentAccount={currentAccount}
            template={{ profile_id: profile?.id || '', template_name: 'Default', frontpsc_background_image: currentAccount?.front_image_url, backpsc_message_template: currentAccount?.back_message }}
            onSave={async (u) => handleSaveAccount({ front_image_url: u.front_image_url, back_message: u.back_message })}
          />
        } />
      </Route>

      <Route path="/pending-entity" element={
        <ProtectedLayout
          profile={profile} accounts={accounts} currentAccount={currentAccount}
          onLogout={handleLogout} onSwitchAccount={handleSwitchAccount} onAddAccount={handleAddAccountReq}
          currentView={ViewState.ACTBLUE_CONNECT}
          onNavigate={handleLayoutNavigate}
        >
          <ActBlueConnect profile={profile!} currentAccount={null} onUpdateProfile={handleUpdateProfile} onSaveAccount={handleSaveAccount} onComplete={() => navigate('/dashboard')} />
        </ProtectedLayout>
      } />

      <Route path="/create-profile" element={
        <UserOnboarding profile={profile} onUpdateProfile={handleUpdateProfile} onComplete={() => navigate('/pending-entity')} />
      } />

      {/* Subscription / Checkout Flow */}
      <Route path="/entities/:entityId/checkout" element={<SubscriptionFlow />} />

      {/* Added Profile Route */}
      <Route path="/profile" element={
        <ProtectedLayout
          profile={profile} accounts={accounts} currentAccount={currentAccount}
          onLogout={handleLogout} onSwitchAccount={handleSwitchAccount} onAddAccount={handleAddAccountReq}
          currentView={ViewState.PROFILE}
          onNavigate={handleLayoutNavigate}
          profileActiveSection={profileActiveSection}
          setProfileActiveSection={setProfileActiveSection}
        >
          <ProfileView
            profile={profile!}
            activeSection={profileActiveSection}
            setActiveSection={setProfileActiveSection}
            onUpdate={handleUpdateProfile}
            onDeleteUser={handleDeleteUser}
          />
        </ProtectedLayout>
      } />

      {/* Catch all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
