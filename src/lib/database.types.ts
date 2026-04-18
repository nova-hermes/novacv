export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          clerk_id: string;
          plan: "free" | "pro_monthly" | "pro_yearly" | "lifetime";
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          clerk_id: string;
          plan?: "free" | "pro_monthly" | "pro_yearly" | "lifetime";
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          clerk_id?: string;
          plan?: "free" | "pro_monthly" | "pro_yearly" | "lifetime";
          stripe_customer_id?: string | null;
          updated_at?: string;
        };
      };
      resumes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          data: Json;
          template_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          title: string;
          data: Json;
          template_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          data?: Json;
          template_id?: string | null;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_sub_id: string;
          plan: "pro_monthly" | "pro_yearly" | "lifetime";
          status: "active" | "cancelled" | "past_due" | "paused";
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_sub_id: string;
          plan: "pro_monthly" | "pro_yearly" | "lifetime";
          status?: "active" | "cancelled" | "past_due" | "paused";
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_sub_id?: string;
          plan?: "pro_monthly" | "pro_yearly" | "lifetime";
          status?: "active" | "cancelled" | "past_due" | "paused";
          current_period_end?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      plan_type: "free" | "pro_monthly" | "pro_yearly" | "lifetime";
      subscription_status: "active" | "cancelled" | "past_due" | "paused";
    };
  };
}
