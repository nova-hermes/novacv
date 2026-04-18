import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env"
  );
}

// Client-side Supabase client (uses anon key, RLS enforced)
export const supabase = createClient<Database>(
  supabaseUrl || "",
  supabaseAnonKey || ""
);

// Server-side Supabase client (uses service role key, bypasses RLS)
// Only use in server-side API routes
export function createServerSupabaseClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY env var is required for server operations");
  }
  return createClient<Database>(supabaseUrl || "", serviceRoleKey);
}
