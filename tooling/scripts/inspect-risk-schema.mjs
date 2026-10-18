import nextEnv from "@next/env";
nextEnv.loadEnvConfig("apps/admin", true);
export async function riskSql(p_sql) {
  const response = await fetch(
    `${process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
    {
      method: "POST",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_sql }),
      signal: AbortSignal.timeout(55000),
    },
  );
  const result = await response.json();
  if (!response.ok || result?.error)
    throw new Error(
      `Database inspection failed (${response.status}): ${result.code || ""} ${result.message || ""}`,
    );
  return result;
}
if (process.argv[1]?.endsWith("inspect-risk-schema.mjs")) {
  console.log(
    JSON.stringify(
      await riskSql(
        `SELECT table_name,column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('qr_activation_attempts','qr_scan_events','qr_stickers','qr_assignments','vehicles','users','qr_status_history','admin_audit_logs','replacement_requests') ORDER BY table_name,ordinal_position`,
      ),
    ),
  );
  console.log(
    JSON.stringify(
      await riskSql(
        `SELECT (SELECT count(*) FROM public.qr_activation_attempts WHERE outcome<>'SUCCESS') failed_activations,(SELECT count(*) FROM public.qr_scan_events WHERE result IN ('RESOLVED_BLOCKED','RESOLVED_REPLACED')) lifecycle_scans,(SELECT count(*) FROM public.admin_sessions WHERE expires_at>now() AND revoked_at IS NULL) available_sessions`,
      ),
    ),
  );
}
