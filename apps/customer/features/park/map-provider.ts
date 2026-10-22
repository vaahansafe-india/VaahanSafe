import "server-only";
import { ParkError } from "./model";

// Provider credentials and saved coordinates never appear in the browser image URL.
export async function fetchParkingMap(
  location: { latitude: number; longitude: number },
  zoom: number,
) {
  const key = process.env.OLA_MAPS_API_KEY;
  if (
    !key ||
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude) ||
    Math.abs(location.latitude) > 90 ||
    Math.abs(location.longitude) > 180 ||
    !Number.isInteger(zoom) ||
    zoom < 12 ||
    zoom > 19
  )
    throw new ParkError("SERVICE_UNAVAILABLE", 503);
  const center = `${location.longitude},${location.latitude}`;
  const url = new URL(
    `https://api.olamaps.io/tiles/v1/styles/default-light-standard/static/${center},${zoom}/800x600.png`,
  );
  url.search = new URLSearchParams({
    api_key: key,
    marker: `${center}|green|scale:0.9`,
  }).toString();
  try {
    const response = await fetch(url, {
      headers: { "X-Request-Id": crypto.randomUUID() },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
    if (
      !response.ok ||
      response.headers.get("content-type")?.split(";")[0] !== "image/png"
    )
      throw new Error("Unavailable map");
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Empty map");
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 2_000_000) {
        await reader.cancel();
        throw new Error("Oversized map");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    if (![137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v))
      throw new Error("Invalid map");
    return bytes.buffer;
  } catch {
    // Never log a provider URL: it contains the server credential and precise location.
    throw new ParkError("SERVICE_UNAVAILABLE", 503);
  }
}
