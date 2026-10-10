import { describe, it, expect, vi, afterEach } from "vitest";
import {
  defaultFilters,
  parseFilters,
  granularity,
  canonicalSearch,
  scanDelta,
  today,
} from "../apps/customer/features/analytics/filters";
import {
  analyticsOptions,
  fetchAnalytics,
} from "../apps/customer/features/analytics/queries";
const now = new Date("2026-10-10T18:40:00Z");
afterEach(() => vi.unstubAllGlobals());
describe("Customer analytics range and filters", () => {
  it("uses India dates across a UTC midnight boundary", () => {
    expect(today(now)).toBe("2026-10-11");
    expect(defaultFilters(now).from).toBe("2026-09-12");
  });
  it.each([
    "from=2026-02-30&to=2026-03-01",
    "from=2025-01-01&to=2026-10-10",
    "from=2026-10-10&to=2026-10-09",
    "to=2026-10-12",
    "grouping=hour&from=2026-10-01&to=2026-10-10",
    "vehicle=x%27%3Bdrop",
    "qr=x%27",
    "outcome=success",
    "device=fingerprint",
    "category=made-up",
  ])("rejects unsupported or unbounded input %s", (search) => {
    expect(() => parseFilters(new URLSearchParams(search), now)).toThrow();
  });
  it("adapts hourly, daily and weekly buckets without thousands of points", () => {
    const f = defaultFilters(now);
    expect(granularity({ ...f, from: f.to })).toBe("hour");
    expect(granularity(f)).toBe("day");
    expect(granularity({ ...f, from: "2026-01-01" })).toBe("week");
  });
  it("ignores forged owner and payment claims", () => {
    expect(
      parseFilters(
        new URLSearchParams("owner=other&customerId=other&isPaid=true"),
        now,
      ),
    ).toEqual(defaultFilters(now));
  });
  it("keeps security query keys independent of vehicle and document filters", () => {
    const f = defaultFilters(now);
    expect(canonicalSearch("security", f)).toBe(
      canonicalSearch("security", {
        ...f,
        vehicle: "other",
        qr: "qr",
        category: "INSURANCE",
      }),
    );
    expect(canonicalSearch("documents", f)).toBe(
      canonicalSearch("documents", {
        ...f,
        outcome: "RESOLVED_BLOCKED",
        device: "Mobile",
        compare: true,
      }),
    );
  });
  it("separates meaningful scan filters and account caches", () => {
    const f = defaultFilters(now);
    expect(
      analyticsOptions("account:session1", "scans", f).queryKey,
    ).not.toEqual(analyticsOptions("account:session2", "scans", f).queryKey);
    expect(canonicalSearch("scans", f)).not.toBe(
      canonicalSearch("scans", { ...f, vehicle: "v1" }),
    );
  });
  it("handles zero previous-period counts without infinity", () => {
    expect(scanDelta(10, 0)).toBe("New activity");
    expect(scanDelta(0, 0)).toContain("No activity");
    expect(scanDelta(20, 10)).toBe("+100% vs previous period");
  });
});
describe("Analytics request boundaries", () => {
  it("passes cancellation to fetch", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetch = vi.fn((_url, init) => {
      expect(init.signal.aborted).toBe(true);
      return Promise.reject(new DOMException("Aborted", "AbortError"));
    });
    vi.stubGlobal("fetch", fetch);
    await expect(
      fetchAnalytics("scope", "scans", "", controller.signal),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
  it("does not populate a previous account cache after another tab signs in", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(Response.json({ scope: "different", data: {} })),
    );
    await expect(
      fetchAnalytics("current", "scans", "", new AbortController().signal),
    ).rejects.toMatchObject({ status: 401 });
  });
  it("treats service failure as an error without invented metrics", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ error: "unavailable" }, { status: 503 }),
        ),
    );
    await expect(
      fetchAnalytics("current", "network", "", new AbortController().signal),
    ).rejects.toMatchObject({ status: 503 });
  });
});
