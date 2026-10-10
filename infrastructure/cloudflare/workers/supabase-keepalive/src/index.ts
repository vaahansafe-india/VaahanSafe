import { probeCapability, publicCapabilityHealth } from "./service-monitoring";

/** Cloudflare Cron probes real services and records measured telemetry. */
export interface Env {
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  SUPABASE_SECRET_KEY: string; // Wrangler secret; never put this in [vars].
  STATUS_DB: D1Database;
  STATUS_WEB_HEALTH_URL?: string;
  STATUS_APP_HEALTH_URL?: string;
  STATUS_ACTIVATE_HEALTH_URL?: string;
  STATUS_QR_HEALTH_URL?: string;
  STATUS_PAYMENTS_HEALTH_URL?: string;
  STATUS_NOTIFICATIONS_HEALTH_URL?: string;
  STATUS_ANALYTICS_HEALTH_URL?: string;
  PAYMENT_PROVIDER?: string;
  RAZORPAY_MODE?: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  MSG91_AUTH_KEY?: string;
  MSG91_WHATSAPP_NUMBER?: string;
  MSG91_WHATSAPP_NAMESPACE?: string;
}

const STALE_AFTER_MS = 25 * 60 * 1000;
const TIMEOUT_MS = 8_000;
const SERVICE_PROBE_TIMEOUT_MS = 6_000;

const serviceTargets = [
  ["website", "STATUS_WEB_HEALTH_URL"],
  ["customer-app", "STATUS_APP_HEALTH_URL"],
  ["retail-activation", "STATUS_ACTIVATE_HEALTH_URL"],
  ["vehicle-qr-access", "STATUS_QR_HEALTH_URL"],
  ["payments", "STATUS_PAYMENTS_HEALTH_URL"],
  ["notifications", "STATUS_NOTIFICATIONS_HEALTH_URL"],
  ["customer-analytics", "STATUS_ANALYTICS_HEALTH_URL"],
] as const;

function safeTarget(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" || !/(^|\.)vaahansafe\.com$/.test(url.hostname)
    || url.username || url.password || url.search || url.hash) {
    throw new Error("Status probe target is not an approved VaahanSafe endpoint");
  }
  return url.toString();
}

async function probeService(url: string): Promise<{ result: "UP" | "DEGRADED" | "DOWN"; latencyMs: number; httpStatus: number | null }> {
  const target = safeTarget(url);
  const started = Date.now();
  try {
    let response = await fetch(target, { method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(SERVICE_PROBE_TIMEOUT_MS), cache: "no-store" });
    if (response.status === 405 || response.status === 501) {
      response = await fetch(target, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(SERVICE_PROBE_TIMEOUT_MS), cache: "no-store" });
    }
    return {
      result: response.ok ? "UP" : response.status >= 500 ? "DOWN" : "DEGRADED",
      latencyMs: Date.now() - started,
      httpStatus: response.status,
    };
  } catch {
    return { result: "DOWN", latencyMs: Date.now() - started, httpStatus: null };
  }
}

export async function recordServiceChecks(env: Env): Promise<void> {
  if (!env.STATUS_DB) throw new Error("Missing Cloudflare D1 status binding");
  const serviceRows = await env.STATUS_DB.prepare("SELECT id, slug FROM status_services WHERE is_public = 1")
    .all<{ id: string; slug: string }>();
  const idBySlug = new Map((serviceRows.results ?? []).map((row) => [row.slug, row.id]));
  const configured = serviceTargets.flatMap(([slug, key]) => {
    const target = env[key];
    const serviceId = idBySlug.get(slug);
    return target && serviceId ? [{ target, serviceId, slug }] : [];
  });
  if (configured.length === 0) throw new Error("No status probe targets are configured");

  const checkedAt = new Date().toISOString();
  const results = await Promise.all(configured.map(async ({ target, serviceId, slug }) => ({
    serviceId, ...(await (slug === "payments" || slug === "notifications" || slug === "customer-analytics"
      ? probeCapability(slug, env) : probeService(target))),
  })));
  await env.STATUS_DB.batch(results.map((result) => env.STATUS_DB.prepare(
    "INSERT OR IGNORE INTO status_probe_samples (service_id, checked_at, result, latency_ms, http_status) VALUES (?, ?, ?, ?, ?)"
  ).bind(result.serviceId, checkedAt, result.result, result.latencyMs, result.httpStatus)));

  // Preserve a full 90-day display window and a small grace period.
  await env.STATUS_DB.prepare("DELETE FROM status_probe_samples WHERE checked_at < ?")
    .bind(new Date(Date.now() - 92 * 24 * 60 * 60 * 1000).toISOString()).run();
}

function endpoint(env: Env, path: string): string {
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(env.SUPABASE_URL)) {
    throw new Error("Supabase URL is not configured safely");
  }
  return `${env.SUPABASE_URL}${path}`;
}


async function queryLatest(env: Env): Promise<{ checked_at: string; status: string; latency_ms: number } | null> {
  if (!env.SUPABASE_PUBLISHABLE_KEY) throw new Error("Missing Supabase publishable key");
  const response = await fetch(endpoint(env,
    "/rest/v1/status_heartbeats?select=checked_at,status,latency_ms&service_name=eq.supabase_database&order=checked_at.desc&limit=1"
  ), {
    headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase heartbeat read failed: ${response.status}`);
  const rows = await response.json() as Array<{ checked_at: string; status: string; latency_ms: number }>;
  return rows[0] ?? null;
}

async function recordHeartbeat(env: Env): Promise<void> {
  if (!env.SUPABASE_SECRET_KEY) throw new Error("Missing Supabase secret key");
  const started = Date.now();
  await queryLatest(env); // A real database round trip, including when no heartbeat exists yet.
  const latencyMs = Date.now() - started;
  const response = await fetch(endpoint(env, "/rest/v1/rpc/ping_heartbeat"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: env.SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
    },
    body: JSON.stringify({
      p_service_name: "supabase_database",
      p_latency_ms: latencyMs,
      p_message: "Cloudflare scheduled database probe",
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Supabase heartbeat write failed: ${response.status}`);
}

export default {
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(recordHeartbeat(env).catch((error: unknown) => {
      console.error("Supabase scheduled probe failed", error instanceof Error ? error.message : "unknown");
    }));
    ctx.waitUntil(recordServiceChecks(env).catch((error: unknown) => {
      console.error("D1 service check failed", error instanceof Error ? error.message : "unknown");
    }));
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;


    if (path === "/services/payments" || path === "/services/notifications") {
      return publicCapabilityHealth(request, env, path === "/services/payments" ? "payments" : "notifications");
    }
    if (path === "/services/customer-analytics") return publicCapabilityHealth(request, env, "customer-analytics");

    if (!["/health", "/"].includes(path)) {
      return new Response("Not found", { status: 404 });
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }

    try {
      const started = Date.now();
      const latest = await queryLatest(env);
      const latencyMs = Date.now() - started;
      const checkedAt = latest?.checked_at ?? null;
      const ageMs = checkedAt ? Date.now() - Date.parse(checkedAt) : Number.NaN;
      const fresh = Number.isFinite(ageMs) && ageMs >= -2 * 60 * 1000
        && ageMs <= STALE_AFTER_MS && latest?.status === "OPERATIONAL";

      const body = JSON.stringify({
        status: fresh ? "OPERATIONAL" : "DEGRADED",
        databaseStatus: "OPERATIONAL",
        cronStatus: fresh ? "OPERATIONAL" : "DEGRADED",
        checkedAt,
        latencyMs,
        scheduledLatencyMs: latest?.latency_ms ?? null,
        service: "supabase_database",
      });

      return new Response(request.method === "HEAD" ? null : body, {
        status: fresh ? 200 : 503,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      });
    } catch (error) {
      console.error("Supabase health probe failed", error instanceof Error ? error.message : "unknown");
      return new Response(
        request.method === "HEAD" ? null : JSON.stringify({ status: "DEGRADED", databaseStatus: "DEGRADED", cronStatus: "UNKNOWN", checkedAt: null }),
        {
          status: 503,
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        }
      );
    }
  },
};
