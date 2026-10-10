import { describe, it, expect, vi, beforeEach } from "vitest";
const fixture = vi.hoisted(() => ({
  auth: vi.fn(),
  queryFirst: vi.fn(),
  account: {
    user: { id: "00000000-0000-4000-8000-000000000001" },
    session: { id: "00000000-0000-4000-8000-000000000002" },
    phoneVerified: true,
  },
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/session", () => ({ getAuthenticatedCustomer: fixture.auth }));
vi.mock("@vaahansafe/database", () => ({
  getAuthoritativeDatabaseClient: () => ({ queryFirst: fixture.queryFirst }),
}));
import { getAnalytics } from "../apps/customer/features/analytics/server";
beforeEach(() => {
  fixture.auth.mockReset().mockResolvedValue(fixture.account);
  fixture.queryFirst.mockReset();
});
describe("Customer analytics authorization", () => {
  it("denies requests without a verified session before querying analytics", async () => {
    fixture.auth.mockResolvedValue(null);
    await expect(
      getAnalytics("scans", new URLSearchParams()),
    ).rejects.toMatchObject({ status: 401 });
    expect(fixture.queryFirst).not.toHaveBeenCalled();
  });
  it("denies unverified-phone sessions", async () => {
    fixture.auth.mockResolvedValue({
      ...fixture.account,
      phoneVerified: false,
    });
    await expect(
      getAnalytics("documents", new URLSearchParams()),
    ).rejects.toMatchObject({ status: 401 });
    expect(fixture.queryFirst).not.toHaveBeenCalled();
  });
  it("denies a foreign vehicle instead of widening the filter", async () => {
    fixture.queryFirst
      .mockResolvedValueOnce({ allowed: true })
      .mockResolvedValueOnce(null);
    await expect(
      getAnalytics("scans", new URLSearchParams("vehicle=foreign")),
    ).rejects.toMatchObject({ status: 404 });
    expect(fixture.queryFirst).toHaveBeenCalledTimes(2);
    expect(fixture.queryFirst.mock.calls[1]?.[1]).toEqual([
      "foreign",
      fixture.account.user.id,
    ]);
  });
  it("denies a foreign or incompatible QR identity", async () => {
    fixture.queryFirst
      .mockResolvedValueOnce({ allowed: true })
      .mockResolvedValueOnce(null);
    await expect(
      getAnalytics("scans", new URLSearchParams("qr=foreign_qr")),
    ).rejects.toMatchObject({ status: 404 });
    expect(fixture.queryFirst).toHaveBeenCalledTimes(2);
  });
  it("stops an expensive request when the database limit is reached", async () => {
    fixture.queryFirst.mockResolvedValueOnce({ allowed: false });
    await expect(
      getAnalytics("network", new URLSearchParams()),
    ).rejects.toMatchObject({ status: 429 });
    expect(fixture.queryFirst).toHaveBeenCalledTimes(1);
  });
  it("rejects a malformed feed cursor before aggregation", async () => {
    fixture.queryFirst.mockResolvedValueOnce({ allowed: true });
    await expect(
      getAnalytics("activity", new URLSearchParams("cursor=not-json")),
    ).rejects.toThrow("refresh");
    expect(fixture.queryFirst).toHaveBeenCalledTimes(1);
  });
});
