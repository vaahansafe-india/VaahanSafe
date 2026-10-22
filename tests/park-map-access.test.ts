import { beforeEach, describe, it, expect, vi } from "vitest";
const state = vi.hoisted(() => ({
  account: null as unknown,
  results: [] as unknown[],
  chains: [] as any[],
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/session", () => ({
  getAuthenticatedCustomer: vi.fn(async () => state.account),
}));
vi.mock("@vaahansafe/database", () => ({
  getSupabaseAdminClient: () => ({
    from: vi.fn((table: string) => {
      const q: any = {
        table,
        select: vi.fn(() => q),
        eq: vi.fn(() => q),
        is: vi.fn(() => q),
        maybeSingle: vi.fn(async () => state.results.shift()),
      };
      state.chains.push(q);
      return q;
    }),
  }),
}));
import { getParkingMapLocation } from "../apps/customer/features/park/server";
const id = "12345678-1234-4234-8234-123456789abc";
beforeEach(() => {
  state.account = { phoneVerified: true, user: { id: "current-owner" } };
  state.results = [];
  state.chains = [];
});
describe("private parking map authorization", () => {
  it("denies signed-out and unverified accounts before any database read", async () => {
    state.account = null;
    await expect(getParkingMapLocation(id)).rejects.toThrow("UNAUTHORIZED");
    state.account = { phoneVerified: false };
    await expect(getParkingMapLocation(id)).rejects.toThrow("PHONE_REQUIRED");
    expect(state.chains).toHaveLength(0);
  });
  it("scopes the record to the current account and hides absent/other-account records", async () => {
    state.results = [{ data: null, error: null }];
    await expect(getParkingMapLocation(id)).rejects.toThrow("NOT_FOUND");
    expect(state.chains[0].eq).toHaveBeenCalledWith("user_id", "current-owner");
    expect(state.chains).toHaveLength(1);
  });
  it("denies maps when the saved vehicle is no longer active or owned", async () => {
    state.results = [
      {
        data: {
          vehicle_id: "old-vehicle",
          latitude: 28.6129,
          longitude: 77.2295,
        },
        error: null,
      },
      { data: null, error: null },
    ];
    await expect(getParkingMapLocation(id)).rejects.toThrow("NOT_FOUND");
    expect(state.chains[1].eq).toHaveBeenCalledWith("user_id", "current-owner");
    expect(state.chains[1].eq).toHaveBeenCalledWith("status", "ACTIVE");
    expect(state.chains[1].is).toHaveBeenCalledWith("deleted_at", null);
  });
  it("returns only saved coordinates after both ownership checks pass", async () => {
    state.results = [
      {
        data: {
          vehicle_id: "owned-vehicle",
          latitude: 28.6129,
          longitude: 77.2295,
        },
        error: null,
      },
      { data: { id: "owned-vehicle" }, error: null },
    ];
    await expect(getParkingMapLocation(id)).resolves.toEqual({
      latitude: 28.6129,
      longitude: 77.2295,
    });
  });
  it("rejects malformed identities and database outages", async () => {
    await expect(getParkingMapLocation("../other")).rejects.toThrow(
      "INVALID_INPUT",
    );
    state.results = [
      { data: null, error: { message: "private database details" } },
    ];
    await expect(getParkingMapLocation(id)).rejects.toThrow(
      "SERVICE_UNAVAILABLE",
    );
  });
});
