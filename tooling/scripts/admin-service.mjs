import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

export function adminService() {
  nextEnv.loadEnvConfig("apps/admin", true);
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key)
    throw new Error("Configure server-side Supabase credentials first.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function executeAdminSql(sql) {
  const { data, error } = await adminService().rpc("exec_sql", { p_sql: sql });
  if (error || data?.error)
    throw new Error("Database operation failed. No credentials were logged.");
  return data;
}
