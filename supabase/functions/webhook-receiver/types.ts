export interface Donor {
    firstname: string;
    lastname: string;
    email: string;
    addr1: string;
    addr2?: string;
    city: string;
    state: string;
    zip: string;
    amount?: number;
}

export interface Entity {
    entity_id: string;
    committee_name: string;
    tier: string;
    balance_cents: number;
    stripe_customer_id: string | null;
    front_image_url: string | null;
    back_message: string | null;
    disclaimer: string | null;
    street_address: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    branding_enabled?: boolean;
    actblue_accounts?: {
        id: string;
        profile_id: string;
    }[];
}

export interface PostcardOverrides {
    front_image_url?: string;
    back_message?: string;
    disclaimer?: string;
}

export interface LobResponse {
    success: boolean;
    lobId?: string;
    url?: string;
    lobStatus?: string;
    error?: string;
}
