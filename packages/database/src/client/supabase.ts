import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase-types";

export type VaahanSafeDatabase = Database;
export type TypedSupabaseClient = SupabaseClient<Database>;

export interface SupabaseConfig {
  url?: string;
  key?: string;
}

/**
 * Returns an authoritative, strongly typed Supabase client instance.
 * Reads environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY by default.
 */
export function getSupabaseClient(config?: SupabaseConfig): TypedSupabaseClient {
  const url = config?.url || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    config?.key ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase configuration. Provide NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export * from "./supabase-types";
