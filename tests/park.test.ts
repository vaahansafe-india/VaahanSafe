import { describe, it, expect } from "vitest";
import {
  parseParkingInput,
  parkClock,
  parkingDirectionsUrl,
  parkingMapUrl,
} from "../apps/customer/features/park/model";
const now = Date.parse("2026-10-22T12:00:00Z");
const input = () => ({
  id: "12345678-1234-4234-8234-123456789abc",
  vehicleId: "veh-owned",
  locationConsent: true,
  location: {
    latitude: 28.6129,
    longitude: 77.2295,
    accuracy: 12,
    capturedAt: new Date(now).toISOString(),
  },
  floor: " B2 ",
  bay: " C-14 ",
  notes: " Near the lift ",
  durationMinutes: 120,
});
describe("private parking inputs", () => {
  it("normalizes a fresh consented location and notes", () => {
    expect(parseParkingInput(input(), now)).toMatchObject({
      floor: "B2",
      bay: "C-14",
      notes: "Near the lift",
      durationMinutes: 120,
    });
  });
  it("requires explicit location consent", () => {
    expect(() =>
      parseParkingInput({ ...input(), locationConsent: false }, now),
    ).toThrow("CONSENT_REQUIRED");
  });
  it("rejects absent, out of range and non-numeric location", () => {
    for (const location of [
      null,
      { ...input().location, latitude: 91 },
      { ...input().location, longitude: Infinity },
      { ...input().location, latitude: "28.6" },
      { ...input().location, accuracy: -1 },
    ])
      expect(() => parseParkingInput({ ...input(), location }, now)).toThrow(
        "LOCATION_REQUIRED",
      );
  });
  it("rejects stale and future timestamps", () => {
    for (const t of [now - 300001, now + 30001])
      expect(() =>
        parseParkingInput(
          {
            ...input(),
            location: {
              ...input().location,
              capturedAt: new Date(t).toISOString(),
            },
          },
          now,
        ),
      ).toThrow("LOCATION_STALE");
  });
  it("rejects oversized notes and arbitrary duration", () => {
    for (const value of [
      { ...input(), notes: "x".repeat(501) },
      { ...input(), durationMinutes: -1 },
      { ...input(), durationMinutes: "60" },
      { ...input(), durationMinutes: 1441 },
    ])
      expect(() => parseParkingInput(value, now)).toThrow("INVALID_INPUT");
  });
  it("never accepts a non-random request identity", () => {
    expect(() => parseParkingInput({ ...input(), id: "1" }, now)).toThrow(
      "INVALID_INPUT",
    );
  });
  it("permits no return-by countdown", () => {
    expect(
      parseParkingInput({ ...input(), durationMinutes: null }, now)
        .durationMinutes,
    ).toBeNull();
  });
});
describe("parking times and directions", () => {
  const session = {
    started_at: "2026-10-22T10:00:00Z",
    return_at: "2026-10-22T13:00:00Z",
    ended_at: null,
    status: "PARKED" as const,
  };
  it("shows actual elapsed and remaining time", () => {
    expect(parkClock(session, now)).toEqual({
      elapsed: "02:00:00",
      remaining: "01:00:00",
      overdue: false,
    });
  });
  it("marks overdue without ending the real parking session", () => {
    expect(
      parkClock({ ...session, return_at: "2026-10-22T11:00:00Z" }, now),
    ).toMatchObject({ remaining: "01:00:00", overdue: true });
  });
  it("freezes elapsed time when the persisted session ends", () => {
    expect(
      parkClock(
        { ...session, status: "ENDED", ended_at: "2026-10-22T11:00:00Z" },
        now,
      ).elapsed,
    ).toBe("01:00:00");
  });
  it("passes only the saved destination to walking directions", () => {
    const u = new URL(parkingDirectionsUrl(28.6, 77.2));
    expect(u.searchParams.get("destination")).toBe("28.6,77.2");
    expect(u.searchParams.get("travelmode")).toBe("walking");
    expect([...u.searchParams.keys()]).toEqual([
      "api",
      "destination",
      "travelmode",
    ]);
  });
  it("renders the actual saved marker on the map", () => {
    const u = new URL(parkingMapUrl(28.6, 77.2));
    expect(u.origin).toBe("https://www.openstreetmap.org");
    expect(u.searchParams.get("marker")).toBe("28.6,77.2");
  });
});
