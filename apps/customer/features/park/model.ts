export interface ParkLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  capturedAt: string;
}
export interface ParkVehicle {
  id: string;
  registration_number: string;
  make: string;
  model: string;
}
export interface ParkSession {
  id: string;
  vehicle_id: string;
  status: "PARKED" | "ENDED";
  latitude: number;
  longitude: number;
  accuracy_m: number;
  location_captured_at: string;
  place_name: string | null;
  floor_label: string;
  bay_label: string;
  notes: string;
  return_at: string | null;
  started_at: string;
  ended_at: string | null;
}
export interface ParkData {
  vehicles: ParkVehicle[];
  sessions: ParkSession[];
}
export class ParkError extends Error {
  constructor(
    public code: string,
    public status = 400,
  ) {
    super(code);
  }
}
export const PARK_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Please sign in to open your parking notebook.",
  PHONE_REQUIRED: "Verify your mobile number to save your parking.",
  LOCATION_REQUIRED:
    "Allow location access and try again. Your location is required to save your spot.",
  LOCATION_STALE:
    "This location is no longer fresh. Capture your location again.",
  CONSENT_REQUIRED: "Please confirm location sharing before saving your spot.",
  VEHICLE_UNAVAILABLE: "Choose an active vehicle from your account.",
  ALREADY_PARKED:
    "This vehicle already has an open parking session. End it before saving a new spot.",
  INVALID_INPUT: "Check your parking details and try again.",
  NOT_FOUND: "This parking record is no longer available.",
  RATE_LIMIT:
    "You have saved several stops in a short time. Please wait a minute and try again.",
  SERVICE_UNAVAILABLE:
    "We couldn’t open your parking notebook right now. Please try again.",
};
export function parseParkingInput(value: unknown, now = Date.now()) {
  if (!value || typeof value !== "object") throw new ParkError("INVALID_INPUT");
  const b = value as Record<string, unknown>;
  const l = b.location as ParkLocation | undefined;
  if (b.locationConsent !== true) throw new ParkError("CONSENT_REQUIRED");
  if (
    !l ||
    ![l.latitude, l.longitude, l.accuracy].every(
      (v) => typeof v === "number" && Number.isFinite(v),
    ) ||
    Math.abs(l.latitude) > 90 ||
    Math.abs(l.longitude) > 180 ||
    l.accuracy < 0 ||
    l.accuracy > 100000
  )
    throw new ParkError("LOCATION_REQUIRED");
  const time =
    typeof l.capturedAt === "string" ? Date.parse(l.capturedAt) : NaN;
  if (!Number.isFinite(time) || time < now - 300000 || time > now + 30000)
    throw new ParkError("LOCATION_STALE");
  if (
    typeof b.id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      b.id,
    )
  )
    throw new ParkError("INVALID_INPUT");
  if (
    typeof b.vehicleId !== "string" ||
    !b.vehicleId.length ||
    b.vehicleId.length > 100
  )
    throw new ParkError("VEHICLE_UNAVAILABLE");
  const text = (key: string, max: number) => {
    const v = b[key] ?? "";
    if (
      typeof v !== "string" ||
      v.length > max ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)
    )
      throw new ParkError("INVALID_INPUT");
    return v.trim();
  };
  const duration = b.durationMinutes ?? null;
  if (
    duration !== null &&
    (!Number.isInteger(duration) ||
      typeof duration !== "number" ||
      duration < 5 ||
      duration > 1440)
  )
    throw new ParkError("INVALID_INPUT");
  return {
    id: b.id,
    vehicleId: b.vehicleId,
    location: l,
    floor: text("floor", 40),
    bay: text("bay", 40),
    notes: text("notes", 500),
    durationMinutes: duration as number | null,
  };
}
export function parkClock(
  session: Pick<
    ParkSession,
    "started_at" | "return_at" | "ended_at" | "status"
  >,
  now = Date.now(),
) {
  const elapsed = Math.max(
    0,
    (session.ended_at ? Date.parse(session.ended_at) : now) -
      Date.parse(session.started_at),
  );
  const remaining = session.return_at
    ? Date.parse(session.return_at) - now
    : null;
  const format = (ms: number) => {
    const total = Math.floor(Math.abs(ms) / 1000);
    return `${String(Math.floor(total / 3600)).padStart(2, "0")}:${String(Math.floor(total / 60) % 60).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  };
  return {
    elapsed: format(elapsed),
    remaining: remaining === null ? null : format(remaining),
    overdue:
      session.status === "PARKED" && remaining !== null && remaining <= 0,
  };
}
export function parkingMapZoom(value: string | null) {
  if (value === null) return 16;
  if (!/^(1[2-9])$/.test(value)) throw new ParkError("INVALID_INPUT");
  return Number(value);
}
export type ParkingMapType = "roadmap" | "satellite";
export function parkingMapType(value: string | null): ParkingMapType {
  if (value === null || value === "roadmap") return "roadmap";
  if (value === "satellite") return "satellite";
  throw new ParkError("INVALID_INPUT");
}
export function parkingMapUrl(
  id: string,
  zoom = 16,
  type: ParkingMapType = "roadmap",
) {
  return `/api/park/${encodeURIComponent(id)}/map?zoom=${parkingMapZoom(String(zoom))}&maptype=${parkingMapType(type)}`;
}
export function parkingDirectionsUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${latitude},${longitude}`)}&travelmode=walking`;
}
