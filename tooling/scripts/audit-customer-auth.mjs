import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

nextEnv.loadEnvConfig("apps/customer", true);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const settingsResponse = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } });
const settings = await settingsResponse.json();
console.log("Auth configuration", { status: settingsResponse.status, google: settings.external?.google, phone: settings.phone_enabled, sms: settings.sms_provider });
const authorize = await fetch(`${url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent("http://localhost:3001/auth/callback")}`, { redirect: "manual" });
const location = authorize.headers.get("location");
console.log("Google authorization", { status: authorize.status, host: location ? new URL(location).host : null, callback: location ? new URL(location).searchParams.get("redirect_uri") : null });
if (location) {
  const state = new URL(location).searchParams.get("state");
  try { const payload = JSON.parse(Buffer.from(state.split(".")[1], "base64url").toString());
    console.log("OAuth return configuration", { siteUrl: payload.site_url, referrer: payload.referrer });
  } catch { console.log("OAuth state is opaque"); }
}
const { data, error } = await client.rpc("exec_sql", { p_sql: "SELECT table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name IN ('users', 'auth_identities', 'sessions') ORDER BY table_name, ordinal_position" });
console.log("Auth schema", error ? { code: error.code, message: error.message } : data);
const { data: policies, error: policyError } = await client.rpc("exec_sql", { p_sql: "SELECT policyname, cmd, roles, qual, with_check FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users'" });
console.log("User policies", policyError ? { code: policyError.code } : policies);
const probes = {
  sessions: "SELECT id, user_id, token_hash, user_agent, ip_address, created_at, last_seen_at, expires_at, revoked_at, revocation_reason FROM sessions WHERE revoked_at IS NULL AND expires_at > now() LIMIT 0",
  trigger: "SELECT pg_get_functiondef('public.handle_new_auth_user()'::regprocedure) AS definition",
  heartbeat: "SELECT service_name, checked_at FROM status_heartbeats WHERE service_name = 'supabase_database' ORDER BY checked_at DESC LIMIT 1",
  permissions: "SELECT has_table_privilege('authenticated', 'public.users', 'UPDATE') AS profile_writable, has_table_privilege('authenticated', 'public.auth_identities', 'INSERT') AS identity_writable, has_function_privilege('anon', 'public.exec_sql(text)', 'EXECUTE') AS anonymous_sql",
};
for (const [probe, sql] of Object.entries(probes)) {
  const result = await client.rpc("exec_sql", { p_sql: sql });
  console.log("Probe", probe, result.error ? { code: result.error.code, message: result.error.message } : probe === "trigger" ? { callbackProvisioning: result.data?.[0]?.definition?.includes("= 'google' THEN RETURN NEW") } : result.data);
}
const configured = value => Boolean(value && !/replace_with|placeholder|dummy|your_/i.test(value));
console.log("Phone provider configuration", { msg91KeyConfigured: configured(process.env.MSG91_AUTH_KEY), templateConfigured: configured(process.env.MSG91_OTP_TEMPLATE_ID) });
for (const resource of ["r2/buckets", "workers/scripts"]) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/${resource}`, { headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` } });
  const result = await response.json();
  const items = result.result?.buckets || result.result;
  console.log("Cloudflare", resource, { status: response.status, success: result.success, resources: Array.isArray(items) ? items.map(item => item.name || item.id) : [] });
}
