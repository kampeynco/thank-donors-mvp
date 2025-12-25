
import React, { useState, useEffect } from 'react';
import { ViewState, Profile, Donation, ActBlueAccount, PostcardTemplate } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PostcardBuilder from './components/PostcardBuilder';
import ActBlueConnect from './components/ActBlueConnect';
import UserOnboarding from './components/UserOnboarding';
import Settings from './components/Settings';
import ProfileView from './components/ProfileView';
import BillingView from './components/BillingView';
import Auth from './components/Auth';
import { supabase } from './services/supabaseClient';
import { Loader2 } from 'lucide-react';
import { useToast } from './components/ToastContext';

const App: React.FC = () => {
  const { toast } = useToast();
  const [view, setView] = useState<ViewState>(ViewState.AUTH);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const loadedUserIdRef = React.useRef<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [accounts, setAccounts] = useState<ActBlueAccount[]>([]);
  const [currentAccount, setCurrentAccount] = useState<ActBlueAccount | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [templates, setTemplates] = useState<PostcardTemplate[]>([]);

  useEffect(() => {
    // Safety timeout to prevent infinite loading
    const safetyTimer = setTimeout(() => {
      if (loading) {
        console.warn("Loading timed out, forcing auth view");
        setLoading(false);
        if (!session) setView(ViewState.AUTH);
      }
    }, 5000);

    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(session);
        if (session) {
          fetchData(session.user.id, session.user.email);
        } else {
          setLoading(false);
          setView(ViewState.AUTH);
        }
      } catch (e) {
        console.error("Auth failed:", e);
        setLoading(false);
        setView(ViewState.AUTH);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthStateChange:', event, session?.user?.id);
      setSession(session);

      if (event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        return;
      }

      // Prevent reloading if the user is already logged in
      if (event === 'SIGNED_IN' && session?.user?.id && loadedUserIdRef.current === session.user.id) {
        console.log('Already loaded for user:', session.user.id);
        return;
      }

      if (session) {
        console.log('Session exists, fetching data for:', session.user.id);
        fetchData(session.user.id, session.user.email);
      } else {
        console.log('No session, resetting view');
        loadedUserIdRef.current = null;
        setView(ViewState.AUTH);
        setProfile(null);
        setAccounts([]);
        setCurrentAccount(null);
        setDonations([]);
        setTemplates([]);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  const fetchData = async (userId: string, userEmail?: string) => {
    console.log('fetchData called for:', userId);
    setLoading(true);
    loadedUserIdRef.current = userId; // Mark as loading/loaded for this user
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Ensure profile exists safely without triggering PGRST116 (0 rows) error
      // when ignoreDuplicates: true is active and row exists.
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true });

      if (upsertError) {
        console.warn('Profile upsert notice:', upsertError.message);
      }

      // Fetch the latest profile data explicitly
      const { data: loadedProfileData, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchErr) throw fetchErr;

      const mappedProfile = { ...loadedProfileData };
      mappedProfile.email = userEmail;

      // Merge metadata only if it exists and doesn't conflict with existing profile data
      // or if we want to synchronize them. Given the user reports issues, 
      // let's prefer the database record if already present.
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

      if (accountsError) {
        console.error('Error fetching accounts:', accountsError);
      }

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

      // 2.3 Fetch Templates for the user's accounts
      if (fetchedAccounts.length > 0) {
        const { data: templatesData } = await supabase
          .from('postcard_templates')
          .select('*')
          .in('actblue_account_id', fetchedAccounts.map(a => a.id))
          .order('created_at', { ascending: false });

        if (templatesData) {
          setTemplates(templatesData as PostcardTemplate[]);
        }
      }

      const isUserProfileComplete = mappedProfile.full_name && mappedProfile.organization;
      console.log('Profile loaded:', { id: userId, complete: isUserProfileComplete, accounts: fetchedAccounts.length });

      if (!isUserProfileComplete) {
        console.log('Redirecting to ONBOARDING');
        setView(ViewState.USER_ONBOARDING);
        setCurrentAccount(null);
      } else if (fetchedAccounts.length > 0) {
        console.log('Redirecting to DASHBOARD');
        const recent = fetchedAccounts[0];
        setCurrentAccount(recent);
        await fetchDonations(userId, recent.id);

        if (view === ViewState.AUTH) {
          setView(ViewState.DASHBOARD);
        }
      } else {
        console.log('Redirecting to ACTBLUE_CONNECT');
        handleAddAccount(userId);

        if (view === ViewState.AUTH) {
          setView(ViewState.ACTBLUE_CONNECT);
        }
      }

    } catch (error: any) {
      console.error('Error loading data:', error);
      toast(`Failed to load data: ${error.message}`, 'error');
    } finally {
      console.log('fetchData finished, setting loading=false');
      setLoading(false);
    }
  };

  const fetchDonations = async (userId: string, accountId?: string) => {
    try {
      let query = supabase
        .from('donations')
        .select(`
              id,
              donor_firstname,
              donor_lastname,
              amount,
              created_at,
              donor_addr1,
              donor_city,
              donor_state,
              donor_zip,
              postcards ( 
                id,
                status, 
                error_message, 
                lob_url, 
                lob_postcard_id,
                postcard_events (
                  id,
                  status,
                  description,
                  created_at
                )
              )
            `)
        .eq('profile_id', userId)
        .order('created_at', { ascending: false });

      if (accountId) {
        query = query.eq('actblue_account_id', accountId);
      }

      const { data: donationData, error: donationError } = await query;

      if (donationError) {
        console.error('Error fetching donations:', donationError);
      } else {
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
            events: postcard?.postcard_events || []
          };
        });
        setDonations(mappedDonations);
      }
    } catch (donErr) {
      console.error("Donation fetch exception:", donErr);
    }
  };

  const handleUpdateProfile = async (updatedFields: Partial<Profile>) => {
    if (!profile || !session) return;

    const {
      email,
      full_name,
      organization,
      job_title,
      ...profileTableFields
    } = updatedFields;

    const errors: string[] = [];

    if (Object.keys(profileTableFields).length > 0) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update(profileTableFields)
          .eq('id', session.user.id);

        if (error) throw error;
      } catch (e: any) {
        console.error('Error updating profiles table:', e);
        errors.push(e.message || 'Database update failed');
      }
    }

    if (full_name !== undefined || organization !== undefined || job_title !== undefined) {
      const metadataUpdates: any = {};
      if (full_name !== undefined) metadataUpdates.full_name = full_name;
      if (organization !== undefined) metadataUpdates.organization = organization;
      if (job_title !== undefined) metadataUpdates.job_title = job_title;

      try {
        const { error } = await supabase.auth.updateUser({
          data: metadataUpdates
        });
        if (error) throw error;
      } catch (e: any) {
        console.error('Error updating auth metadata:', e);
        errors.push(e.message || 'User metadata update failed');
      }
    }

    if (errors.length > 0) {
      toast(`Error updating profile: ${errors.join(', ')}`, 'error');
    } else {
      setProfile(prev => prev ? { ...prev, ...updatedFields } : null);
      toast("Profile updated successfully", "success");
    }
  };

  const handleSaveAccount = async (accountData: Partial<ActBlueAccount>) => {
    if (!session || !profile) return;

    try {
      if (currentAccount && currentAccount.id !== 'new') {
        // Update existing account
        // Update centralized entity details
        const updates: any = { ...accountData };
        if (updates.entity_id) updates.entity_id = Number(updates.entity_id);

        const { error } = await supabase
          .from('actblue_entities')
          .update(updates)
          .eq('entity_id', currentAccount.entity_id);

        if (error) throw error;

        // Update local state
        const updated = { ...currentAccount, ...accountData } as ActBlueAccount;
        if (accountData.entity_id) updated.entity_id = Number(accountData.entity_id);

        setCurrentAccount(updated);
        setAccounts(accounts.map(a => a.id === updated.id ? updated : a));
        toast("Account details saved", "success");

      } else {
        // Create NEW Account - Integrate with Hookdeck Edge Function

        const entityId = Number(accountData.entity_id) || 0;
        const committeeName = accountData.committee_name || 'My Campaign';

        if (entityId === 0) {
          throw new Error("Valid Entity ID is required.");
        }

        toast("Provisioning webhook...", "info");

        // 1. Call Edge Function to create Hookdeck Source/Destination/Connection
        const { data: hookdeckData, error: hookdeckError } = await supabase.functions.invoke('connect-hookdeck', {
          body: {
            committee_name: committeeName,
            entity_id: entityId,
            profile_id: session.user.id,
            disclaimer: accountData.disclaimer,
            street_address: accountData.street_address,
            city: accountData.city,
            state: accountData.state,
            postal_code: accountData.postal_code
          }
        });

        if (hookdeckError) {
          throw new Error(`Webhook provisioning failed: ${hookdeckError.message}`);
        }

        // The edge function returns { account: { ... }, hookdeck: { ... } }
        const accountDataFromFn = hookdeckData?.account;

        if (!accountDataFromFn?.webhook_url) {
          console.error("Invalid Hookdeck Response:", hookdeckData);
          throw new Error("Invalid response from webhook provisioner");
        }
        // 2. Update Local State with returned account (DB insert handled by Edge Function)

        // The connect-hookdeck function returns the full account object as 'account'
        const createdAccount = accountDataFromFn;

        // Ensure we have a valid account object before updating state
        if (!createdAccount || !createdAccount.id) {
          throw new Error("Failed to receive valid account data from server");
        }

        // Update local state
        setAccounts([createdAccount, ...accounts]);
        setCurrentAccount(createdAccount);
        toast("New account created with secure webhook!", "success");
      }

    } catch (e: any) {
      console.error("Failed to save account", e);
      toast(`Error saving account: ${e.message}`, 'error');
      throw e;
    }
  };

  const handleSwitchAccount = (account: ActBlueAccount) => {
    setCurrentAccount(account);
    fetchDonations(session.user.id, account.id);
    setView(ViewState.DASHBOARD);
  };

  const handleAddAccount = (userId?: string) => {
    const uid = userId || session?.user?.id;
    if (!uid) return;
    setCurrentAccount({
      id: 'new',
      profile_id: uid,
      entity_id: 0,
      committee_name: '',
      webhook_url: '',
      webhook_username: '',
      webhook_password: '',
      webhook_source_id: ''
    });
    setView(ViewState.ACTBLUE_CONNECT);
  };

  const handleDeleteAccount = async () => {
    if (!currentAccount || currentAccount.id === 'new') return;

    // Use Edge Function to delete, ensuring Hookdeck resources are also cleaned up
    try {
      const { error } = await supabase.functions.invoke('delete-actblue-account', {
        body: { account_id: currentAccount.id }
      });

      if (error) throw error;

      const remainingAccounts = accounts.filter(a => a.id !== currentAccount.id);
      setAccounts(remainingAccounts);
      toast("Account deleted", "info");

      if (remainingAccounts.length > 0) {
        handleSwitchAccount(remainingAccounts[0]);
      } else {
        handleAddAccount();
      }
    } catch (e: any) {
      toast(`Failed to delete account: ${e.message}`, 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!session?.user?.id) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', session.user.id);

      if (error) throw error;

      await supabase.auth.signOut();
      setView(ViewState.AUTH);
      toast("User account deleted", "info");
    } catch (e: any) {
      toast(`Failed to delete user: ${e.message}`, 'error');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView(ViewState.AUTH);
    toast("Logged out", "info");
  };

  const handleLogin = async () => {
    toast("Welcome back!", "success");
    console.log("Manual login trigger - ensuring data fetch");
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setSession(session);
      // Determine if we need to fetch data
      if (loadedUserIdRef.current !== session.user.id) {
        fetchData(session.user.id, session.user.email);
      } else {
        // If data is already loaded or loading for this user, we might just need to update view
        console.log("User data already loaded/loading, checking view state");
        if (view === ViewState.AUTH) {
          // We can't easily know where to go without checking profile/accounts again or storing result.
          // Safe bet: just run fetchData again, it's cheap enough (DB select) or rely on existing state?
          // Actually fetchData is safe to re-run.
          fetchData(session.user.id, session.user.email);
        }
      }
    }
  };

  const handleUserOnboardingComplete = () => {
    handleAddAccount();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 text-rose-600">
        <Loader2 size={40} className="animate-spin" />
      </div>
    );
  }

  if (view === ViewState.AUTH) {
    return <Auth onLogin={handleLogin} />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-stone-400 mx-auto mb-2" />
          <p className="text-stone-500">Setting up your dashboard...</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm text-rose-600 hover:underline">
            Reload
          </button>
        </div>
      </div>
    );
  }

  if (view === ViewState.USER_ONBOARDING) {
    return (
      <UserOnboarding
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        onComplete={handleUserOnboardingComplete}
      />
    );
  }

  return (
    <Layout
      currentView={view}
      onChangeView={setView}
      onLogout={handleLogout}
      accounts={accounts}
      currentAccount={currentAccount}
      onSwitchAccount={handleSwitchAccount}
      onAddAccount={() => handleAddAccount()}
    >
      {view === ViewState.DASHBOARD && <Dashboard donations={donations} />}
      {view === ViewState.POSTCARD_BUILDER && (
        <PostcardBuilder
          profile={profile!}
          account={currentAccount}
          templates={templates.filter(t => t.actblue_account_id === currentAccount?.id)}
          onSave={async (updates, templateId) => {
            if (templateId) {
              // Update existing template or create new if requested
              const { data, error } = await supabase
                .from('postcard_templates')
                .upsert({
                  id: templateId === 'new' ? undefined : templateId,
                  actblue_account_id: currentAccount?.id,
                  front_image_url: updates.front_image_url,
                  back_message: updates.back_message,
                  template_name: updates.template_name || 'My Template',
                  is_active: true
                })
                .select()
                .single();

              if (error) throw error;

              // Deactivate other templates if this one is active
              await supabase
                .from('postcard_templates')
                .update({ is_active: false })
                .eq('actblue_account_id', currentAccount?.id)
                .neq('id', data.id);

              // Update local state
              setTemplates(prev => {
                const filtered = prev.filter(t => t.id !== data.id && t.actblue_account_id === currentAccount?.id);
                const others = prev.filter(t => t.actblue_account_id !== currentAccount?.id);
                return [...others, { ...data, is_active: true }, ...filtered.map(t => ({ ...t, is_active: false }))];
              });

              toast("Template saved and set as active", "success");
            } else {
              // Save as account default
              return handleSaveAccount({
                front_image_url: updates.front_image_url,
                back_message: updates.back_message
              });
            }
          }}
        />
      )}
      {view === ViewState.ACTBLUE_CONNECT && (
        <ActBlueConnect
          profile={profile!}
          currentAccount={currentAccount}
          onUpdateProfile={handleUpdateProfile}
          onSaveAccount={handleSaveAccount}
          onComplete={() => setView(ViewState.DASHBOARD)}
        />
      )}
      {view === ViewState.BILLING && (
        <BillingView
          profile={profile!}
          account={currentAccount}
          onUpdateAccount={async (updates) => {
            // Re-use handleSaveAccount logic or direct update to actblue_entities
            if (!currentAccount) return;
            const { error } = await supabase
              .from('actblue_entities')
              .update(updates)
              .eq('entity_id', currentAccount.entity_id);

            if (error) {
              toast("Failed to update billing settings", "error");
              throw error;
            }

            // Update local state
            const updated = { ...currentAccount, ...updates } as any;
            if (currentAccount.entity) {
              updated.entity = { ...currentAccount.entity, ...updates };
            }
            setCurrentAccount(updated);
            setAccounts(accounts.map(a => a.id === updated.id ? updated : a));
          }}
        />
      )}
      {view === ViewState.SETTINGS && (
        <Settings
          profile={profile!}
          currentAccount={currentAccount}
          onUpdate={handleUpdateProfile}
          onDeleteAccount={handleDeleteAccount}
          onSaveAccount={handleSaveAccount}
        />
      )}
      {view === ViewState.PROFILE && (
        <ProfileView
          profile={profile!}
          onUpdate={handleUpdateProfile}
          onDeleteUser={handleDeleteUser}
        />
      )}
    </Layout>
  );
};

export default App;
