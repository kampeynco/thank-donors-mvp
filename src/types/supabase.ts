export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      actblue_accounts: {
        Row: {
          archived_at: string | null
          archived_user_email: string | null
          back_message: string | null
          city: string | null
          committee_name: string
          country: string | null
          created_at: string | null
          disclaimer: string | null
          election_level: string | null
          entity_id: number
          front_image_url: string | null
          id: string
          office_sought: string | null
          platform: string
          postal_code: string | null
          profile_id: string
          state: string | null
          street_address: string | null
          stripe_customer_id: string | null
          thanksio_subaccount_id: number | null
          updated_at: string | null
          webhook_connection_id: string | null
          webhook_password: string
          webhook_source_id: string
          webhook_url: string
          webhook_username: string
        }
        Insert: {
          archived_at?: string | null
          archived_user_email?: string | null
          back_message?: string | null
          city?: string | null
          committee_name: string
          country?: string | null
          created_at?: string | null
          disclaimer?: string | null
          election_level?: string | null
          entity_id: number
          front_image_url?: string | null
          id?: string
          office_sought?: string | null
          platform?: string
          postal_code?: string | null
          profile_id: string
          state?: string | null
          street_address?: string | null
          stripe_customer_id?: string | null
          thanksio_subaccount_id?: number | null
          updated_at?: string | null
          webhook_connection_id?: string | null
          webhook_password: string
          webhook_source_id: string
          webhook_url: string
          webhook_username: string
        }
        Update: {
          archived_at?: string | null
          archived_user_email?: string | null
          back_message?: string | null
          city?: string | null
          committee_name?: string
          country?: string | null
          created_at?: string | null
          disclaimer?: string | null
          election_level?: string | null
          entity_id?: number
          front_image_url?: string | null
          id?: string
          office_sought?: string | null
          platform?: string
          postal_code?: string | null
          profile_id?: string
          state?: string | null
          street_address?: string | null
          stripe_customer_id?: string | null
          thanksio_subaccount_id?: number | null
          updated_at?: string | null
          webhook_connection_id?: string | null
          webhook_password?: string
          webhook_source_id?: string
          webhook_url?: string
          webhook_username?: string
        }
        Relationships: [
          {
            foreignKeyName: "actblue_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          actblue_account_id: string | null
          amount: number | null
          created_at: string | null
          donation_date: string | null
          donor_addr1: string | null
          donor_addr2: string | null
          donor_city: string | null
          donor_country: string | null
          donor_email: string | null
          donor_firstname: string | null
          donor_lastname: string | null
          donor_phone: string | null
          donor_state: string | null
          donor_zip: string | null
          id: string
          order_number: string | null
          profile_id: string
          raw_payload: Json | null
          updated_at: string | null
        }
        Insert: {
          actblue_account_id?: string | null
          amount?: number | null
          created_at?: string | null
          donation_date?: string | null
          donor_addr1?: string | null
          donor_addr2?: string | null
          donor_city?: string | null
          donor_country?: string | null
          donor_email?: string | null
          donor_firstname?: string | null
          donor_lastname?: string | null
          donor_phone?: string | null
          donor_state?: string | null
          donor_zip?: string | null
          id?: string
          order_number?: string | null
          profile_id: string
          raw_payload?: Json | null
          updated_at?: string | null
        }
        Update: {
          actblue_account_id?: string | null
          amount?: number | null
          created_at?: string | null
          donation_date?: string | null
          donor_addr1?: string | null
          donor_addr2?: string | null
          donor_city?: string | null
          donor_country?: string | null
          donor_email?: string | null
          donor_firstname?: string | null
          donor_lastname?: string | null
          donor_phone?: string | null
          donor_state?: string | null
          donor_zip?: string | null
          id?: string
          order_number?: string | null
          profile_id?: string
          raw_payload?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_actblue_account_id_fkey"
            columns: ["actblue_account_id"]
            isOneToOne: false
            referencedRelation: "actblue_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      postcards: {
        Row: {
          created_at: string | null
          donation_id: string
          error_message: string | null
          id: string
          status: string
          stripe_charge_id: string | null
          thanksio_order_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          donation_id: string
          error_message?: string | null
          id?: string
          status?: string
          stripe_charge_id?: string | null
          thanksio_order_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          donation_id?: string
          error_message?: string | null
          id?: string
          status?: string
          stripe_charge_id?: string | null
          thanksio_order_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "postcards_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          organization: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          organization?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          organization?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
