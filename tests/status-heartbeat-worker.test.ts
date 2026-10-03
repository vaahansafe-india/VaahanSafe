import { afterEach, describe, expect, it, vi } from "vitest";
import worker, { type Env } from "../infrastructure/cloudflare/workers/supabase-keepalive/src/index";

const env: Env = {
  SUPABASE_URL: "https://status-example.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "public-test-key",
  SUPABASE_SECRET_KEY: "server-test-key",
  STATUS_DB: {} as D1Database,
};

afterEach(() => vi.unstubAllGlobals());

describe("Supabase scheduled heartbeat public health route", () => {
  it("records only configured real service probe outcomes in D1", async () => {
    const inserts: Array<{ params: unknown[] }> = [];
    const statusDb = {
      prepare: (sql: string) => {
        if (sql.startsWith("SELECT")) return { all: async () => ({ results: [
          { id: "srv_website", slug: "website" },
          { id: "srv_customer_app", slug: "customer-app" },
          { id: "srv_payments", slug: "payments" },
        ] }) };
        return { bind: (...params: unknown[]) => ({ params, run: async () => ({ success: true }) }) };
      },
      batch: async (statements: Array<{ params: unknown[] }>) => { inserts.push(...statements); return []; },
    } as unknown as D1Database;
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/rest/v1/status_heartbeats")) return Response.json([]);
      if (url.includes("/rest/v1/rpc/ping_heartbeat")) return Response.json({ success: true });
      return new Response(null, { status: url.includes("app.vaahansafe.com") ? 503 : 200 });
    }));
    const tasks: Promise<unknown>[] = [];
    await worker.scheduled({} as ScheduledController, {
      ...env, STATUS_DB: statusDb,
      STATUS_WEB_HEALTH_URL: "https://www.vaahansafe.com/",
      STATUS_APP_HEALTH_URL: "https://app.vaahansafe.com/api/auth/session",
    }, { waitUntil: (task: Promise<unknown>) => { tasks.push(task); } } as ExecutionContext);
    await Promise.all(tasks);

    expect(inserts).toHaveLength(2);
    expect(inserts.map((statement) => statement.params[0])).toEqual(["srv_website", "srv_customer_app"]);
    expect(inserts.map((statement) => statement.params[2])).toEqual(["UP", "DOWN"]);
  });

  it("does not let a public request create a heartbeat", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const trigger = await worker.fetch(new Request("https://worker.example/trigger"), env);
    const post = await worker.fetch(new Request("https://worker.example/health", { method: "POST" }), env);

    expect(trigger.status).toBe(404);
    expect(post.status).toBe(405);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("reports an overdue Cron run even when Supabase responds", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json([{
      checked_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      status: "OPERATIONAL",
      latency_ms: 38,
    }])));

    const response = await worker.fetch(new Request("https://worker.example/health"), env);
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(503);
    expect(body.databaseStatus).toBe("OPERATIONAL");
    expect(body.cronStatus).toBe("DEGRADED");
  });

  it("reports separate healthy states after a recent scheduled run", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json([{
      checked_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      status: "OPERATIONAL",
      latency_ms: 42,
    }])));

    const response = await worker.fetch(new Request("https://worker.example/health"), env);
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.databaseStatus).toBe("OPERATIONAL");
    expect(body.cronStatus).toBe("OPERATIONAL");
    expect(body.scheduledLatencyMs).toBe(42);
  });
});
