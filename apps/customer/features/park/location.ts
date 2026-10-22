import "server-only";
import { randomUUID } from "node:crypto";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import type { ParkSession } from "./model";
/** Provider key, exact GPS and request URL stay on the server. No public cache. */
export async function enrichParkLocation(session: ParkSession) {
  if (session.place_name || !process.env.OLA_MAPS_API_KEY) return;
  const url = new URL("https://api.olamaps.io/places/v1/reverse-geocode");
  url.search = new URLSearchParams({
    latlng: `${session.latitude},${session.longitude}`,
    language: "en",
    api_key: process.env.OLA_MAPS_API_KEY,
  }).toString();
  const response = await fetch(url, {
    headers: { "X-Request-Id": randomUUID() },
    cache: "no-store",
    signal: AbortSignal.timeout(4500),
  });
  if (!response.ok) throw new Error("Parking address unavailable");
  const data = (await response.json()) as {
    results?: { formatted_address?: unknown }[];
  };
  const raw = data.results?.[0]?.formatted_address;
  if (typeof raw !== "string") return;
  const name = raw
    .replace(/[\u0000-\u001f]/g, " ")
    .trim()
    .slice(0, 240);
  if (!name) return;
  const { error } = await getSupabaseAdminClient()
    .from("park_sessions")
    .update({ place_name: name })
    .eq("id", session.id)
    .is("place_name", null);
  if (error) throw new Error("Parking address unavailable");
}
