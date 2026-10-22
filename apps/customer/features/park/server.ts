import "server-only";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import { getAuthenticatedCustomer } from "@/lib/session";
import {
  ParkError,
  parseParkingInput,
  type ParkData,
  type ParkSession,
} from "./model";
const fields =
  "id,vehicle_id,status,latitude,longitude,accuracy_m,location_captured_at,place_name,floor_label,bay_label,notes,return_at,started_at,ended_at";
export async function parkAccount() {
  const a = await getAuthenticatedCustomer();
  if (!a) throw new ParkError("UNAUTHORIZED", 401);
  if (!a.phoneVerified) throw new ParkError("PHONE_REQUIRED", 403);
  return a;
}
export async function getParkingData(): Promise<ParkData> {
  const a = await parkAccount();
  const db = getSupabaseAdminClient();
  const [vehicles, parked, ended] = await Promise.all([
    db
      .from("vehicles")
      .select("id,registration_number,make,model")
      .eq("user_id", a.user.id)
      .eq("status", "ACTIVE")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(100),
    db
      .from("park_sessions")
      .select(fields)
      .eq("user_id", a.user.id)
      .eq("status", "PARKED")
      .order("started_at", { ascending: false })
      .limit(100),
    db
      .from("park_sessions")
      .select(fields)
      .eq("user_id", a.user.id)
      .eq("status", "ENDED")
      .order("started_at", { ascending: false })
      .limit(50),
  ]);
  if (vehicles.error || parked.error || ended.error)
    throw new ParkError("SERVICE_UNAVAILABLE", 503);
  // Historical location is only visible while the vehicle is still owned by this account.
  const ids = new Set((vehicles.data || []).map((v) => v.id));
  return {
    vehicles: vehicles.data || [],
    sessions: [...(parked.data || []), ...(ended.data || [])].filter((s) =>
      ids.has(s.vehicle_id),
    ) as ParkSession[],
  };
}
export async function startParking(value: unknown) {
  const a = await parkAccount();
  const b = parseParkingInput(value);
  const db = getSupabaseAdminClient();
  const { data, error } = await db.rpc("start_park_session", {
    p_user_id: a.user.id,
    p_id: b.id,
    p_vehicle_id: b.vehicleId,
    p_latitude: b.location.latitude,
    p_longitude: b.location.longitude,
    p_accuracy_m: b.location.accuracy,
    p_captured_at: b.location.capturedAt,
    p_floor: b.floor,
    p_bay: b.bay,
    p_notes: b.notes,
    p_duration_minutes: b.durationMinutes,
  });
  if (error) {
    if (error.code === "23505") throw new ParkError("ALREADY_PARKED", 409);
    if (error.code === "42501") throw new ParkError("VEHICLE_UNAVAILABLE", 403);
    if (error.code === "22023") throw new ParkError("LOCATION_STALE");
    if (error.code === "54000") throw new ParkError("RATE_LIMIT", 429);
    throw new ParkError("SERVICE_UNAVAILABLE", 503);
  }
  return data as ParkSession;
}
export async function getParkingMapLocation(id: string) {
  const account = await parkAccount();
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    throw new ParkError("INVALID_INPUT");
  const db = getSupabaseAdminClient();
  const record = await db
    .from("park_sessions")
    .select("vehicle_id,latitude,longitude")
    .eq("id", id)
    .eq("user_id", account.user.id)
    .maybeSingle();
  if (record.error) throw new ParkError("SERVICE_UNAVAILABLE", 503);
  if (!record.data) throw new ParkError("NOT_FOUND", 404);
  const vehicle = await db
    .from("vehicles")
    .select("id")
    .eq("id", record.data.vehicle_id)
    .eq("user_id", account.user.id)
    .eq("status", "ACTIVE")
    .is("deleted_at", null)
    .maybeSingle();
  if (vehicle.error) throw new ParkError("SERVICE_UNAVAILABLE", 503);
  if (!vehicle.data) throw new ParkError("NOT_FOUND", 404);
  return {
    latitude: record.data.latitude as number,
    longitude: record.data.longitude as number,
  };
}
export async function changeParking(id: string, action: "end" | "delete") {
  const a = await parkAccount();
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new ParkError("INVALID_INPUT");
  const db = getSupabaseAdminClient();
  const query = db.from("park_sessions");
  const result =
    action === "delete"
      ? await query.delete().eq("id", id).eq("user_id", a.user.id).select("id")
      : await query
          .update({ status: "ENDED", ended_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", a.user.id)
          .eq("status", "PARKED")
          .select("id");
  if (result.error) throw new ParkError("SERVICE_UNAVAILABLE", 503);
  if (!result.data?.length) throw new ParkError("NOT_FOUND", 404);
}
