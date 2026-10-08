// Bindings matching the Supabase-backed QR runtime in wrangler.jsonc.
interface __BaseQrEnv_Env {
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  NEXT_PUBLIC_APP_ENV: "development" | "staging" | "production";
  ANALYTICS_QUEUE: Queue;
}
declare namespace Cloudflare {
  interface DevelopmentEnv extends __BaseQrEnv_Env {}
  interface StagingEnv extends __BaseQrEnv_Env {}
  interface ProductionEnv extends __BaseQrEnv_Env {}
  interface Env extends __BaseQrEnv_Env {}
}
interface Env extends __BaseQrEnv_Env {}
