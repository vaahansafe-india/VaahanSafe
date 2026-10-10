import { MSG91_TEMPLATE_CATALOG } from "../../../../../packages/notifications/src/whatsapp/catalog";
import type { Env } from "./index";

export type Capability = "payments" | "notifications" | "customer-analytics";
export interface ServiceCheck {
  result: "UP" | "DEGRADED" | "DOWN";
  latencyMs: number;
  httpStatus: number | null;
}

// Fixed, read-only aggregate queries. No customer or payment payload leaves the database.
export const PAYMENT_HEALTH_SQL = `SELECT
  NOT EXISTS (SELECT 1 FROM public.payment_webhook_events
    WHERE processing_status IN ('RECEIVED','PROCESSING') AND received_at < now()-interval '10 minutes')
  AND NOT EXISTS (SELECT 1 FROM public.payment_webhook_events
    WHERE processing_status = 'FAILED' AND received_at > now()-interval '24 hours')
  AND NOT EXISTS (SELECT 1 FROM public.payments
    WHERE status IN ('SUCCESS','PAID') AND confirmed_at IS NULL) AS healthy`;

export const NOTIFICATION_HEALTH_SQL = `SELECT
  EXISTS (SELECT 1 FROM cron.job j WHERE j.jobname='vaahansafe-notification-drain' AND j.active
    AND EXISTS (SELECT 1 FROM cron.job_run_details r WHERE r.jobid=j.jobid
      AND r.status='succeeded' AND r.start_time > now()-interval '5 minutes'))
  AND EXISTS (SELECT 1 FROM net._http_response WHERE created > now()-interval '5 minutes'
    AND status_code=200 AND NOT coalesce(timed_out,false)
    AND content ~ '"processed"[[:space:]]*:[[:space:]]*[0-9]+'
    AND content ~ '"failed"[[:space:]]*:[[:space:]]*0[[:space:]]*[,}]') AS scheduler_healthy,
  NOT EXISTS (SELECT 1 FROM public.notification_intents WHERE
    (status='PENDING' AND coalesce(next_attempt_at,created_at) < now()-interval '10 minutes') OR
    (status='QUEUED' AND coalesce(lease_expires_at,next_attempt_at,created_at) < now()-interval '10 minutes'))
  AND NOT EXISTS (SELECT 1 FROM public.notification_deliveries WHERE
    (status IN ('PENDING','FAILED_RETRYABLE') AND coalesce(next_attempt_at,updated_at) < now()-interval '10 minutes') OR
    (status='PROCESSING' AND provider_message_id IS NULL AND updated_at < now()-interval '10 minutes') OR
    (status IN ('FAILED_PERMANENT','DEAD_LETTERED') AND updated_at > now()-interval '24 hours')) AS pipeline_healthy,
  EXISTS (SELECT 1 FROM public.notification_deliveries WHERE channel='WHATSAPP'
    AND status='PROCESSING' AND provider_message_id IS NOT NULL
    AND updated_at < now()-interval '60 minutes') AS receipt_confirmation_pending`;

// Provider-accepted sends can remain PROCESSING while awaiting a receipt.
// That is delivery uncertainty, not evidence of a sending outage. Keep the
// receipt diagnostic separate and never promote the business record to DELIVERED.

// Execute the reporting joins and column contracts with bounded reads. An empty
// source is legitimate; traffic volume is never used as proof of availability.
export const ANALYTICS_HEALTH_SQL = `SELECT
  (SELECT count(*) FROM (SELECT e.created_at,e.result,e.state,e.city,e.user_agent_family
    FROM public.qr_scan_events e JOIN public.qr_assignments a ON a.qr_id=e.qr_id AND a.ended_at IS NULL
    JOIN public.vehicles v ON v.id=a.vehicle_id WHERE v.deleted_at IS NULL
    ORDER BY e.created_at DESC LIMIT 100) scans) >= 0
  AND (SELECT count(*) FROM (SELECT o.file_size_bytes,o.mime_type,o.is_current
    FROM public.customer_storage_originals o JOIN public.customer_documents d ON d.id=o.document_id
    WHERE d.deleted_at IS NULL LIMIT 100) originals) >= 0
  AND (SELECT count(*) FROM (SELECT e.event_type,e.created_at FROM public.customer_document_events e
    JOIN public.customer_documents d ON d.id=e.document_id WHERE d.deleted_at IS NULL LIMIT 100) events) >= 0
  AND EXISTS (SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='vault_session_owner') AS healthy`;

async function queryHealth(env: Env, sql: string): Promise<Record<string, unknown>> {
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(env.SUPABASE_URL) || !env.SUPABASE_SECRET_KEY) {
    throw new Error("Monitoring database unavailable");
  }
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: { apikey: env.SUPABASE_SECRET_KEY, Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_sql: sql }),
    signal: AbortSignal.timeout(8_000),
    redirect: "manual", // Runtime rejects "error"; non-2xx responses fail closed without forwarding credentials.
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Monitoring database HTTP ${response.status}`);
  const rows = await response.json() as Array<Record<string, unknown>>;
  if (!Array.isArray(rows) || rows.length !== 1) throw new Error("Monitoring database unavailable");
  return rows[0];
}

/** Route reachability only: HEAD cannot validate a signed provider callback. */
async function callbackReachable(path: string): Promise<boolean> {
  const response = await fetch(`https://app.vaahansafe.com/api/webhooks/${path}`, {
    method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(8_000), cache: "no-store",
  });
  await response.body?.cancel();
  return response.status === 405;
}

async function razorpayAccessible(env: Env): Promise<boolean> {
  if (env.PAYMENT_PROVIDER !== "razorpay" || env.RAZORPAY_MODE !== "live"
    || !/^rzp_live_[a-zA-Z0-9]+$/.test(env.RAZORPAY_KEY_ID ?? "") || !env.RAZORPAY_KEY_SECRET) return false;
  const response = await fetch("https://api.razorpay.com/v1/orders?count=1", {
    headers: { Authorization: `Basic ${btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`)}` },
    signal: AbortSignal.timeout(8_000), redirect: "manual", cache: "no-store",
  });
  // Discard provider records. This request neither creates an order nor initiates payment.
  await response.body?.cancel();
  return response.ok;
}

async function templateApproved(env: Env, name: keyof typeof MSG91_TEMPLATE_CATALOG): Promise<boolean> {
  if (!env.MSG91_AUTH_KEY || !/^\d{8,15}$/.test(env.MSG91_WHATSAPP_NUMBER ?? "") || !env.MSG91_WHATSAPP_NAMESPACE) return false;
  const response = await fetch(
    `https://control.msg91.com/api/v5/whatsapp/get-template-client/${env.MSG91_WHATSAPP_NUMBER}?template_name=${name}&pagination=false`, {
      headers: { authkey: env.MSG91_AUTH_KEY }, signal: AbortSignal.timeout(8_000), redirect: "manual", cache: "no-store",
    });
  if (!response.ok) { await response.body?.cancel(); return false; }
  const data = await response.json() as { status?: string; hasError?: boolean; data?: Array<{
    name: string; namespace: string; languages?: Array<{ language: string; status?: string; is_disabled?: boolean | number; variables?: string[] }>;
  }> };
  return data.status === "success" && !data.hasError && Array.isArray(data.data) && data.data.some((template) =>
    template.name === name && template.namespace === env.MSG91_WHATSAPP_NAMESPACE && template.languages?.some((language) =>
      language.language === MSG91_TEMPLATE_CATALOG[name].language && language.status?.toUpperCase() === "APPROVED" && !language.is_disabled
      && Array.isArray(language.variables) && language.variables.join(",") === Array.from({ length: MSG91_TEMPLATE_CATALOG[name].bodyCount }, (_, index) => `body_${index + 1}`).join(",")));
}

/** Only scheduled checks call providers; public requests read saved samples. */
export async function probeCapability(service: Capability, env: Env): Promise<ServiceCheck> {
  const started = Date.now();
  const checks = service === "customer-analytics" ? [queryHealth(env, ANALYTICS_HEALTH_SQL).then((row) => row.healthy === true)] : service === "payments"
    ? [queryHealth(env, PAYMENT_HEALTH_SQL).then((row) => row.healthy === true), razorpayAccessible(env), callbackReachable("razorpay")]
    : [queryHealth(env, NOTIFICATION_HEALTH_SQL).then((row) => row.scheduler_healthy === true && row.pipeline_healthy === true),
      callbackReachable("msg91"), ...(["vhn_qr_scan_notice_v2", "vhn_vehicle_report_v1", "vhn_vehicle_emergency_report_v1"] as const)
        .map((name) => templateApproved(env, name))];
  const outcomes = await Promise.allSettled(checks);
  if (outcomes.some((outcome) => outcome.status === "rejected")) {
    console.warn("Capability probe failed", { service, failedChecks: outcomes.flatMap((outcome, index) =>
      outcome.status === "rejected" ? [{ index, kind: outcome.reason instanceof Error && /^Monitoring database HTTP \d+$/.test(outcome.reason.message)
        ? outcome.reason.message : outcome.reason instanceof Error && /redirect/i.test(outcome.reason.message)
          ? "Redirect mode unsupported" : outcome.reason instanceof Error ? `Request unavailable (${outcome.reason.name})` : "Request unavailable" }] : []) });
  }
  const result = outcomes.some((outcome) => outcome.status === "rejected") ? "DOWN"
    : outcomes.every((outcome) => outcome.status === "fulfilled" && outcome.value) ? "UP" : "DEGRADED";
  return { result, latencyMs: Date.now() - started, httpStatus: result === "UP" ? 200 : 503 };
}

export async function publicCapabilityHealth(request: Request, env: Env, service: Capability): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  let status = "UNKNOWN", checkedAt: string | null = null, latencyMs: number | null = null;
  try {
    const latest = await env.STATUS_DB.prepare(`SELECT p.result,p.checked_at,p.latency_ms FROM status_probe_samples p
      JOIN status_services s ON s.id=p.service_id WHERE s.slug=? AND s.is_public=1 ORDER BY p.checked_at DESC LIMIT 1`)
      .bind(service).first<{ result: string; checked_at: string; latency_ms: number }>();
    if (latest) {
      checkedAt = latest.checked_at;
      latencyMs = latest.latency_ms;
      const age = Date.now() - Date.parse(checkedAt);
      status = Number.isFinite(age) && age >= -120_000 && age <= 25 * 60_000
        ? latest.result === "UP" ? "OPERATIONAL" : latest.result === "DOWN" ? "DOWN" : "DEGRADED" : "UNKNOWN";
    }
  } catch { /* A failed read must never report success or expose infrastructure errors. */ }
  return new Response(request.method === "HEAD" ? null : JSON.stringify({ service, status, checkedAt, latencyMs }), {
    status: status === "OPERATIONAL" ? 200 : 503,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
