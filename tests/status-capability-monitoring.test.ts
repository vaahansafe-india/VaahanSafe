import { afterEach, describe, expect, it, vi } from "vitest";
import worker, { type Env } from "../infrastructure/cloudflare/workers/supabase-keepalive/src/index";
import { probeCapability } from "../infrastructure/cloudflare/workers/supabase-keepalive/src/service-monitoring";
import { MSG91_TEMPLATE_CATALOG } from "../packages/notifications/src/whatsapp/catalog";
import { getPublicSystemStatus } from "@vaahansafe/status-core/server";

const env: Env = {
  SUPABASE_URL: "https://test-project.supabase.co", SUPABASE_PUBLISHABLE_KEY: "test-public",
  SUPABASE_SECRET_KEY: "test-server", STATUS_DB: {} as D1Database,
  PAYMENT_PROVIDER: "razorpay", RAZORPAY_MODE: "live", RAZORPAY_KEY_ID: "rzp_live_testing", RAZORPAY_KEY_SECRET: "test-secret",
  MSG91_AUTH_KEY: "test-msg91", MSG91_WHATSAPP_NUMBER: "919999999999", MSG91_WHATSAPP_NAMESPACE: "test-namespace",
};
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

function providers(pipelineHealthy = true, languageOverride?: string, receiptPending = false, schedulerHealthy = true) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("exec_sql")) return Response.json([{ healthy: true, scheduler_healthy: schedulerHealthy, pipeline_healthy: pipelineHealthy, receipt_confirmation_pending: receiptPending }]);
    if (url.includes("/webhooks/")) return new Response(null, { status: 405 });
    if (url.includes("razorpay.com")) return Response.json({ items: [{ privateCustomerData: "discarded" }] });
    const name = new URL(url).searchParams.get("template_name") as keyof typeof MSG91_TEMPLATE_CATALOG;
    expect(init?.method ?? "GET").toBe("GET");
    return Response.json({ status: "success", data: [{ name, namespace: "test-namespace", languages: [{
      language: languageOverride ?? MSG91_TEMPLATE_CATALOG[name].language, status: "APPROVED", is_disabled: false,
      variables: Array.from({ length: MSG91_TEMPLATE_CATALOG[name].bodyCount }, (_, index) => `body_${index + 1}`),
    }] }] });
  });
}

describe("Scheduled real capability monitoring", () => {
  it("uses only read-only provider calls and aggregates; never sends messages or initiates payments", async () => {
    const fetchSpy = providers(); vi.stubGlobal("fetch", fetchSpy);
    expect((await probeCapability("payments", env)).result).toBe("UP");
    expect((await probeCapability("notifications", env)).result).toBe("UP");
    for (const [input, init] of fetchSpy.mock.calls) {
      expect(init?.redirect).toBe("manual");
      if (String(input).includes("exec_sql")) {
        expect(JSON.parse(String(init?.body)).p_sql).toMatch(/^SELECT/);
      } else expect(init?.method ?? "GET").not.toBe("POST");
    }
    expect(fetchSpy.mock.calls.filter(([url]) => String(url).includes("razorpay.com"))).toHaveLength(1);
  });
  it("checks analytics availability without requiring fresh traffic or returning customer records", async () => {
    const spy = providers(); vi.stubGlobal("fetch", spy);
    expect((await probeCapability("customer-analytics", env)).result).toBe("UP");
    expect(spy).toHaveBeenCalledTimes(1);
    const sql = JSON.parse(String(spy.mock.calls[0][1]?.body)).p_sql;
    expect(sql).toContain("LIMIT 100");
    expect(sql).toContain("customer_storage_originals");
    expect(sql).toContain("qr_scan_events");
  });

  it("reports overdue unsent work or recorded failures as degraded", async () => {
    vi.stubGlobal("fetch", providers(false));
    expect((await probeCapability("notifications", env)).result).toBe("DEGRADED");
  });

  it("keeps provider-accepted sends awaiting receipts separate from service availability", async () => {
    vi.stubGlobal("fetch", providers(true, undefined, true));
    expect((await probeCapability("notifications", env)).result).toBe("UP");
  });

  it("still degrades when the notification scheduler stops", async () => {
    vi.stubGlobal("fetch", providers(true, undefined, true, false));
    expect((await probeCapability("notifications", env)).result).toBe("DEGRADED");
  });

  it("requires the catalog language and rejects sandbox payment credentials", async () => {
    vi.stubGlobal("fetch", providers(true, "en"));
    expect((await probeCapability("notifications", env)).result).toBe("DEGRADED");
    expect((await probeCapability("payments", { ...env, RAZORPAY_MODE: "test" })).result).toBe("DEGRADED");
  });

  it("fails closed on database failures and waits for all concurrent checks", async () => {
    const spy = providers();
    vi.stubGlobal("fetch", vi.fn((input, init) => String(input).includes("exec_sql") ? Promise.reject(new Error("private error")) : spy(input, init)));
    expect((await probeCapability("payments", env)).result).toBe("DOWN");
  });
});

describe("Status app scheduled measurement freshness", () => {
  const db = { query: async () => [], queryFirst: async () => null };
  it.each([[5, "OPERATIONAL", 200, "OPERATIONAL"], [5, "DOWN", 503, "PARTIAL OUTAGE"], [30, "OPERATIONAL", 200, "UNKNOWN"]])(
    "preserves scheduled state for age %s status %s", async (age, status, http, expected) => {
      vi.stubEnv("STATUS_PAYMENTS_HEALTH_URL", "https://monitor.test/services/payments");
      const checkedAt = new Date(Date.now() - Number(age) * 60_000).toISOString();
      vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => Response.json({ status, checkedAt, latencyMs: 987 }, { status: Number(http) })));
      const result = await getPublicSystemStatus(db);
      const payment = result.services.find((service) => service.slug === "payments");
      expect(payment?.state).toBe(expected);
      expect(payment).not.toHaveProperty("targetUrl");
      expect(JSON.stringify(result)).not.toContain("monitor.test");
      if (Number(age) < 25) {
        expect(payment?.lastProbeAt).toBe(checkedAt);
        expect(payment?.latencyMs).toBe(987);
      } else expect(payment?.lastProbeAt).toBeUndefined();
    });
});

describe("Public cached capability projection", () => {
  function database(ageMinutes: number, result: string) {
    return { prepare: () => ({ bind: () => ({ first: async () => ({
      result, checked_at: new Date(Date.now() - ageMinutes * 60_000).toISOString(), latency_ms: 42,
      secret: "must-not-leak", customer: "must-not-leak",
    }) }) }) } as unknown as D1Database;
  }
  it("reads recent D1 results without provider calls and exposes only public health fields", async () => {
    const spy = vi.fn(); vi.stubGlobal("fetch", spy);
    const response = await worker.fetch(new Request("https://monitor.test/services/payments"), { ...env, STATUS_DB: database(5, "UP") });
    expect(response.status).toBe(200);
    expect(Object.keys(await response.json()).sort()).toEqual(["checkedAt", "latencyMs", "service", "status"]);
    expect(spy).not.toHaveBeenCalled();
  });
  it.each([[30, "UP", "UNKNOWN"], [5, "DEGRADED", "DEGRADED"], [5, "DOWN", "DOWN"]])("returns non-success for age %s result %s", async (age, result, status) => {
    const response = await worker.fetch(new Request("https://monitor.test/services/notifications"), { ...env, STATUS_DB: database(Number(age), String(result)) });
    expect(response.status).toBe(503);
    expect((await response.json()).status).toBe(status);
  });
  it("rejects public mutations and returns no body for HEAD", async () => {
    expect((await worker.fetch(new Request("https://monitor.test/services/payments", { method: "POST" }), env)).status).toBe(405);
    const response = await worker.fetch(new Request("https://monitor.test/services/payments", { method: "HEAD" }), { ...env, STATUS_DB: database(5, "UP") });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("");
  });
});
