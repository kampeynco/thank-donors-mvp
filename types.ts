
export interface Profile {
  id: string;
  email?: string; // Not in DB, injected by app
  // New user details (Auth Metadata)
  full_name?: string;
  organization?: string;
  job_title?: string;
}

export interface ActBlueAccount {
  id: string;
  profile_id: string;
  entity_id: number;
  committee_name: string;
  webhook_url: string;
  webhook_username: string;
  webhook_password: string;
  webhook_source_id: string;
  webhook_connection_id?: string;
  thanksio_subaccount_id?: number;
  election_level?: string;
  office_sought?: string;
  // Address fields
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  // Design fields
  front_image_url?: string;
  back_message?: string;
  disclaimer?: string;
}

export interface Donation {
  id: string;
  donor_firstname?: string;
  donor_lastname?: string;
  amount: number;
  created_at: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  error_message?: string;
  actblue_account_id?: string;
}

export interface Template {
  profile_id: string;
  template_name: string;
  frontpsc_background_image?: string;
  backpsc_message_template?: string;
}

export enum ViewState {
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
  POSTCARD_BUILDER = 'POSTCARD_BUILDER',
  ACTBLUE_CONNECT = 'ACTBLUE_CONNECT',
  BILLING = 'BILLING',
  SETTINGS = 'SETTINGS',
  PROFILE = 'PROFILE',
  USER_ONBOARDING = 'USER_ONBOARDING'
}
