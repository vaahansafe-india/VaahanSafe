/** Cloudflare Cron probes the real Supabase database and records a heartbeat. */
export interface Env {
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  SUPABASE_SECRET_KEY: string; // Wrangler secret; never put this in [vars].
}

const STALE_AFTER_MS = 25 * 60 * 1000;
const TIMEOUT_MS = 8_000;

function endpoint(env: Env, path: string): string {
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(env.SUPABASE_URL)) {
    throw new Error("Supabase URL is not configured safely");
  }
  return `${env.SUPABASE_URL}${path}`;
}

async function queryLatest(env: Env): Promise<{ checked_at: string } | null> {
  if (!env.SUPABASE_PUBLISHABLE_KEY) throw new Error("Missing Supabase publishable key");
  const response = await fetch(endpoint(env,
    "/rest/v1/status_heartbeats?select=checked_at&service_name=eq.supabase_database&order=checked_at.desc&limit=1"
  ), {
    headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase heartbeat read failed: ${response.status}`);
  const rows = await response.json() as Array<{ checked_at: string }>;
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
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (!["/health", "/ping", "/trigger", "/"].includes(path)) {
      return new Response("Not found", { status: 404 });
    }

    try {
      const shouldRecord = path === "/trigger" || request.method === "POST" || url.searchParams.get("record") === "true";
      if (shouldRecord && env.SUPABASE_SECRET_KEY) {
        await recordHeartbeat(env);
      }

      const started = Date.now();
      const latest = await queryLatest(env);
      const latencyMs = Date.now() - started;
      let checkedAt = latest?.checked_at ?? null;
      let fresh = checkedAt !== null && Number.isFinite(Date.parse(checkedAt))
        && Date.now() - Date.parse(checkedAt) <= STALE_AFTER_MS;

      // Auto-heal: If heartbeats are stale and not just recorded, record one now
      if (!fresh && !shouldRecord && env.SUPABASE_SECRET_KEY) {
        try {
          await recordHeartbeat(env);
          const updated = await queryLatest(env);
          checkedAt = updated?.checked_at ?? checkedAt;
          fresh = true;
        } catch (healErr) {
          console.error("Auto-heal heartbeat failed:", healErr);
        }
      }

      const body = JSON.stringify({
        status: fresh ? "OPERATIONAL" : "DEGRADED",
        checkedAt,
        latencyMs,
        service: "supabase_database",
      });

      return new Response(request.method === "HEAD" ? null : body, {
        status: fresh ? 200 : 503,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      });
    } catch (error) {
      console.error("Supabase health probe failed", error instanceof Error ? error.message : "unknown");
      return new Response(
        request.method === "HEAD" ? null : JSON.stringify({ status: "DOWN", error: error instanceof Error ? error.message : "unknown" }),
        {
          status: 503,
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        }
      );
    }
  },
};

