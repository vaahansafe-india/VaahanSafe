import { afterEach, describe, expect, it, vi } from "vitest";
import {
  handleRequest,
  type ViewerEnv,
  type ViewerReport,
} from "../apps/view/src/index";
import { reportViewToken } from "../packages/notifications/src/links/report-view-link";
afterEach(() => vi.unstubAllGlobals());
const proof = "A".repeat(43);
function report(): ViewerReport {
  return {
    reason: "PARKING",
    vehicleReference: "MH••••1234",
    reportReference: "RPT-ABCDEF",
    reportedAt: new Date().toISOString(),
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    note: "Finder report",
    location: null,
    photos: [
      {
        key: "scan-reports/report_11111111-1111-4111-8111-111111111111/0.jpg",
        mimeType: "image/jpeg",
        size: 4,
      },
    ],
    reportId: "report_11111111-1111-4111-8111-111111111111",
  };
}
function env(): ViewerEnv {
  return {
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "server-fixture",
    ASSETS: { fetch: vi.fn() },
    REPORT_PHOTOS: {
      get: vi
        .fn()
        .mockResolvedValue({
          body: new Blob([new Uint8Array([255, 216, 255, 0])]).stream(),
          size: 4,
        }),
    },
    VIEW_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) },
  };
}
function request(
  path = "/api/report",
  body: unknown = { token: proof },
  origin = "https://view.vaahansafe.com",
) {
  return new Request(`https://view.vaahansafe.com${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });
}
describe("Expiring report viewer", () => {
  it("derives purpose-separated high-entropy links and stores only hashes", async () => {
    const a = await reportViewToken("intent-one", "a".repeat(32)),
      b = await reportViewToken("intent-two", "a".repeat(32));
    expect(a.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(a.token).not.toBe(b.token);
    expect(await reportViewToken("intent-one", "a".repeat(32))).toEqual(a);
    expect(
      (await reportViewToken("intent-one", "b".repeat(32))).token,
    ).not.toBe(a.token);
    await expect(reportViewToken("intent", "short")).rejects.toThrow();
  });
  it("serves a branded shell without report data or indexable metadata", async () => {
    const response = await handleRequest(
      new Request("https://view.vaahansafe.com/r"),
      env(),
    );
    expect(await response.text()).toContain("Care starts with");
    expect(response.headers.get("x-robots-tag")).toContain("noindex");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it.each(["bad", "", "<script>alert(1)</script>"])(
    "denies malformed proof without database access: %s",
    async (token) => {
      const fetch = vi.fn();
      vi.stubGlobal("fetch", fetch);
      expect(
        (await handleRequest(request(undefined, { token }), env())).status,
      ).toBe(410);
      expect(fetch).not.toHaveBeenCalled();
    },
  );
  it("bounds request bytes, restricts origins and rate limits before DB access", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect(
      (
        await handleRequest(
          request(undefined, { token: "A".repeat(300) }),
          env(),
        )
      ).status,
    ).toBe(410);
    expect(
      (
        await handleRequest(
          request(undefined, undefined, "https://unrelated.example"),
          env(),
        )
      ).status,
    ).toBe(403);
    const e = env();
    vi.mocked(e.VIEW_RATE_LIMITER.limit).mockResolvedValue({ success: false });
    expect((await handleRequest(request(), e)).status).toBe(429);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("removes storage keys and internal IDs from the public projection", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json(report()));
    vi.stubGlobal("fetch", fetch);
    const response = await handleRequest(request(), env());
    const data = await response.json();
    expect(data.photoCount).toBe(1);
    expect(data.location).toBeNull();
    expect(data.photos).toBeUndefined();
    expect(data.reportId).toBeUndefined();
    const args = fetch.mock.calls[0][1];
    expect(args.body).not.toContain(proof);
    expect(JSON.parse(args.body).p_token_hash).toMatch(/^[a-f0-9]{64}$/);
  });
  it.each([
    null,
    { ...report(), expiresAt: new Date(Date.now() - 1).toISOString() },
  ])(
    "denies expired, unknown or revoked grants on photo requests",
    async (record) => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(record)));
      const e = env();
      expect((await handleRequest(request("/api/photos/0"), e)).status).toBe(
        410,
      );
      expect(e.REPORT_PHOTOS.get).not.toHaveBeenCalled();
    },
  );
  it("checks the report-specific photo path and MIME before R2 access", async () => {
    const r = report();
    r.photos[0].key = "private-documents/another-account";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(r)));
    const e = env();
    expect((await handleRequest(request("/api/photos/0"), e)).status).toBe(404);
    expect(e.REPORT_PHOTOS.get).not.toHaveBeenCalled();
  });
  it("streams only an authorized photo with private no-cache headers", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(report())));
    const response = await handleRequest(request("/api/photos/0"), env());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect((await response.arrayBuffer()).byteLength).toBe(4);
  });
  it("fails closed on infrastructure errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("private provider error", { status: 500 }),
        ),
    );
    const response = await handleRequest(request(), env());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("provider error");
  });
});
