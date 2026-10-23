import "server-only";
import { ParkError, type ParkingMapType } from "./model";

// Browser credential restricted to the customer origin and Maps Embed API.
// Never substitute the private Ola reverse-geocoding key here.
export function parkingGoogleEmbedUrl(
  location: { latitude: number; longitude: number },
  zoom: number,
  maptype: ParkingMapType,
) {
  const key = process.env.GOOGLE_MAPS_EMBED_API_KEY;
  if (
    !key ||
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude) ||
    Math.abs(location.latitude) > 90 ||
    Math.abs(location.longitude) > 180 ||
    !Number.isInteger(zoom) ||
    zoom < 12 ||
    zoom > 19 ||
    !["roadmap", "satellite"].includes(maptype)
  )
    throw new ParkError("SERVICE_UNAVAILABLE", 503);
  const point = `${location.latitude},${location.longitude}`;
  const url = new URL("https://www.google.com/maps/embed/v1/place");
  url.search = new URLSearchParams({
    key,
    q: point,
    center: point,
    zoom: String(zoom),
    maptype,
    language: "en",
    region: "IN",
  }).toString();
  return url.toString();
}
