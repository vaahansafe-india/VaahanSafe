import type { SharedScanLocation } from "./scan-report";

export function isFreshScanLocation(
  value: unknown,
  now = Date.now(),
): value is SharedScanLocation {
  if (!value || typeof value !== "object") return false;
  const l = value as SharedScanLocation;
  const time =
    typeof l.capturedAt === "string" ? Date.parse(l.capturedAt) : NaN;
  return (
    [l.latitude, l.longitude, l.accuracy, time].every(Number.isFinite) &&
    Math.abs(l.latitude) <= 90 &&
    Math.abs(l.longitude) <= 180 &&
    l.accuracy >= 0 &&
    l.accuracy <= 100000 &&
    time <= now + 30000 &&
    time >= now - 300000
  );
}

/** Coarse labels only in scan analytics. Never forward scan identifiers or exact GPS. */
export async function scanLocationLabels(location: SharedScanLocation) {
  const origin =
    process.env.PHOTON_GEOCODER_ORIGIN || "https://photon.komoot.io";
  const provider = new URL(origin);
  if (
    provider.protocol !== "https:" ||
    provider.origin !== origin ||
    provider.username ||
    provider.password
  )
    throw new Error("Location service unavailable");
  const url = new URL("/reverse", origin);
  url.search = new URLSearchParams({
    lat: location.latitude.toFixed(3),
    lon: location.longitude.toFixed(3),
    limit: "1",
    lang: "en",
    radius: "5",
  }).toString();
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "VaahanSafeQR/1.0 (+https://qr.vaahansafe.com)",
    },
    signal: AbortSignal.timeout(4000),
    next: { revalidate: 86400 },
  });
  if (!response.ok) throw new Error("Location service unavailable");
  const body = (await response.json()) as {
    features?: { properties?: Record<string, unknown> }[];
  };
  const p = body.features?.[0]?.properties;
  const clean = (v: unknown) =>
    typeof v === "string"
      ? v
          .replace(/[\u0000-\u001f]/g, "")
          .trim()
          .slice(0, 100)
      : "";
  const city = clean(p?.city || p?.locality || p?.district || p?.county);
  const state = clean(p?.state);
  const country = clean(p?.countrycode).toUpperCase();
  if (!state || !/^[A-Z]{2}$/.test(country))
    throw new Error("Location name unavailable");
  return { city: city || null, state, country };
}
