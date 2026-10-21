import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createScanLocationTicket,
  readScanLocationTicket,
} from "../apps/qr/lib/scan-location-ticket";
import {
  isFreshScanLocation,
  scanLocationLabels as realLabels,
} from "../packages/qr/src/reports/location";
import { validateScanReport } from "../packages/qr/src/reports/scan-report";

const mocks = vi.hoisted(() => ({
  queryFirst: vi.fn(),
  execute: vi.fn(),
  resolve: vi.fn(),
  labels: vi.fn(),
}));
vi.mock("@vaahansafe/database", () => ({
  getAuthoritativeDatabaseClient: () => ({
    queryFirst: mocks.queryFirst,
    execute: mocks.execute,
  }),
}));
vi.mock("../apps/qr/lib/supabase-resolver", () => ({
  createSupabaseQrRepository: () => ({}),
}));
vi.mock("@vaahansafe/qr-core", () => ({
  resolvePublicQr: mocks.resolve,
  scanLocationLabels: mocks.labels,
  isFreshScanLocation: (value: unknown) => isFreshScanLocation(value),
}));
import { POST } from "../apps/qr/app/api/scan-location/route";

const fresh = () => ({
  latitude: 17.385044,
  longitude: 78.486671,
  accuracy: 35,
  capturedAt: new Date().toISOString(),
});
const makeTicket = () =>
  createScanLocationTicket("qse_existing", "qr_existing", "VS-ABCD1234567890");
function request(body: object, origin = "https://qr.vaahansafe.com") {
  return new Request("https://qr.vaahansafe.com/api/scan-location", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.stubEnv("SESSION_SECRET", "unit-only-secret-with-at-least-32-characters");
  mocks.queryFirst.mockReset();
  mocks.resolve.mockReset();
  mocks.labels.mockReset();
  mocks.execute
    .mockReset()
    .mockResolvedValue({ success: true, rowsAffected: 1 });
  mocks.resolve.mockResolvedValue({ state: "ACTIVE", qrId: "qr_existing" });
  mocks.queryFirst
    .mockResolvedValueOnce({
      id: "qse_existing",
      referrer_class: "DIRECT_SCAN",
    })
    .mockResolvedValue({ id: "qse_existing" });
  mocks.labels.mockResolvedValue({
    city: "Hyderabad",
    state: "Telangana",
    country: "IN",
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Scan location scope and consent", () => {
  it("encrypts internal identifiers and rejects altered, expired or wrong-key tickets", () => {
    const token = makeTicket();
    expect(readScanLocationTicket(token)).toMatchObject({
      eventId: "qse_existing",
      qrId: "qr_existing",
    });
    expect(Buffer.from(token, "base64url").toString()).not.toContain(
      "qr_existing",
    );
    expect(
      readScanLocationTicket((token[0] === "A" ? "B" : "A") + token.slice(1)),
    ).toBeNull();
    expect(readScanLocationTicket(token, Date.now() + 900001)).toBeNull();
    vi.stubEnv(
      "SESSION_SECRET",
      "another-test-key-with-at-least-32-characters",
    );
    expect(readScanLocationTicket(token)).toBeNull();
  });
  it("requires a fresh valid device fix and rejects absent report location on the server", () => {
    for (const value of [
      undefined,
      {},
      { ...fresh(), latitude: 91 },
      { ...fresh(), longitude: -181 },
      { ...fresh(), accuracy: -1 },
      { ...fresh(), capturedAt: new Date(Date.now() - 310000).toISOString() },
      { ...fresh(), capturedAt: new Date(Date.now() + 60000).toISOString() },
    ])
      expect(isFreshScanLocation(value)).toBe(false);
    expect(isFreshScanLocation(fresh())).toBe(true);
    expect(() =>
      validateScanReport({
        publicId: "VS-ABCD1234567890",
        requestId: crypto.randomUUID(),
        consent: true,
        reason: "PARKING",
        note: "",
        photos: [],
      }),
    ).toThrow("LOCATION_REQUIRED");
  });
  it("rejects cross-origin, forged tickets and missing consent before any database/geocoder call", async () => {
    expect((await POST(request({}, "https://elsewhere.example"))).status).toBe(
      403,
    );
    expect(
      (
        await POST(
          request({ ticket: "forged", consent: true, location: fresh() }),
        )
      ).status,
    ).toBe(410);
    expect(
      (
        await POST(
          request({ ticket: makeTicket(), consent: false, location: fresh() }),
        )
      ).status,
    ).toBe(400);
    expect(mocks.queryFirst).not.toHaveBeenCalled();
    expect(mocks.labels).not.toHaveBeenCalled();
  });
  it("rechecks entitlement and never geocodes a missing event", async () => {
    mocks.resolve.mockResolvedValueOnce({ state: "BLOCKED" });
    expect(
      (
        await POST(
          request({ ticket: makeTicket(), consent: true, location: fresh() }),
        )
      ).status,
    ).toBe(404);
    mocks.queryFirst.mockReset().mockResolvedValue(null);
    expect(
      (
        await POST(
          request({ ticket: makeTicket(), consent: true, location: fresh() }),
        )
      ).status,
    ).toBe(409);
    expect(mocks.labels).not.toHaveBeenCalled();
  });
  it("updates the original signed event without inserting a second scan or storing exact GPS", async () => {
    const response = await POST(
      request({
        ticket: makeTicket(),
        consent: true,
        location: fresh(),
        eventId: "qse_someone_else",
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      recorded: true,
      place: "Hyderabad, Telangana",
    });
    const [sql, params] = mocks.execute.mock.calls[0]!;
    expect(sql).toContain("UPDATE qr_scan_events");
    expect(sql).not.toContain("INSERT");
    expect(params).toEqual([
      "Hyderabad",
      "Telangana",
      "Telangana",
      "IN",
      "qse_existing",
      "qr_existing",
    ]);
  });
  it("does not repeat the geocoder or update after an already recorded location", async () => {
    mocks.queryFirst.mockReset().mockResolvedValue({
      id: "qse_existing",
      referrer_class: "DIRECT_SCAN_LOCATION_SHARED",
      city: "Hyderabad",
      state: "Telangana",
    });
    expect(
      (
        await POST(
          request({ ticket: makeTicket(), consent: true, location: fresh() }),
        )
      ).status,
    ).toBe(200);
    expect(mocks.labels).not.toHaveBeenCalled();
    expect(mocks.queryFirst).toHaveBeenCalledTimes(1);
  });
  it("returns a recoverable error instead of inventing a location on provider failure", async () => {
    mocks.labels.mockRejectedValue(
      new Error("provider detail must stay private"),
    );
    const response = await POST(
      request({ ticket: makeTicket(), consent: true, location: fresh() }),
    );
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain(
      "provider detail",
    );
    expect(mocks.queryFirst).toHaveBeenCalledTimes(1);
  });
  it("rounds outbound coordinates and accepts only provider-derived state/country labels", async () => {
    const fetch = vi.fn().mockResolvedValue(
      Response.json({
        features: [
          {
            properties: {
              city: "Hyderabad",
              state: "Telangana",
              countrycode: "in",
            },
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetch);
    expect(await realLabels(fresh())).toEqual({
      city: "Hyderabad",
      state: "Telangana",
      country: "IN",
    });
    const url = new URL(fetch.mock.calls[0]![0]);
    expect(url.searchParams.get("lat")).toBe("17.385");
    expect(url.searchParams.get("lon")).toBe("78.487");
    expect(url.href).not.toContain("qse_");
    expect(url.href).not.toContain("ticket");
    fetch.mockResolvedValueOnce(Response.json({ features: [] }));
    await expect(realLabels(fresh())).rejects.toThrow(
      "Location name unavailable",
    );
  });
});
