
export type user_tier = 'free' | 'pro';

export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  organization?: string;
  job_title?: string;
  // Personal settings only
  onboarding_completed?: boolean;
}

export interface BillingTransaction {
  id: string;
  profile_id: string;
  entity_id?: number; // Linked to entity if it's an account transaction
  amount_cents: number;
  type: 'topup' | 'postcard_deduction' | 'subscription_fee' | 'refund';
  description: string;
  stripe_payment_intent_id?: string;
  created_at: string;
}

export interface ActBlueEntity {
  entity_id: number;
  committee_name: string;
  front_image_url?: string;
  back_message?: string;
  disclaimer?: string;
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  webhook_url: string;
  webhook_username: string;
  webhook_password: string;
  webhook_source_id: string;
  webhook_connection_id?: string;
  // Shared Billing fields
  tier: user_tier;
  balance_cents: number;
  auto_topup_enabled: boolean;
  auto_topup_amount_cents: number;
  branding_enabled?: boolean; // New field for postcards branding (default true)
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ActBlueAccount {
  id: string;
  profile_id: string;
  entity_id: number;
  created_at: string;
  archived_at?: string;
  // Merged fields from Entity for backward compatibility/joining
  entity?: ActBlueEntity;
  // We keep these here for now to avoid breaking UI that expects them on the account object
  committee_name?: string;
  front_image_url?: string;
  back_message?: string;
  disclaimer?: string;
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  webhook_url?: string;
}

export interface PostcardEvent {
  id: string;
  postcard_id: string;
  status: string;
  description?: string;
  created_at: string;
}

export interface Donation {
  id: string;
  donor_firstname?: string;
  donor_lastname?: string;
  amount: number;
  created_at: string;
  status: string;
  error_message?: string;
  actblue_account_id?: string;
  lob_url?: string;
  lob_postcard_id?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  front_image_url?: string;
  back_message?: string;
  events?: PostcardEvent[];
  updated_at?: string;
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
  USER_ONBOARDING = 'USER_ONBOARDING',
  LANDING_PAGE = 'LANDING_PAGE',
  PRICING_PAGE = 'PRICING_PAGE'
}

export interface Postcard {
  id: string;
  donation_id: string;
  profile_id: string;
  status: string;
  lob_postcard_id?: string;
  lob_url?: string;
  error_message?: string;
  created_at: string;
  events?: PostcardEvent[];
}
