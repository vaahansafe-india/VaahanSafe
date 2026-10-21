export interface SharedLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  capturedAt: string;
}
export function validLocation(
  location: SharedLocation | null,
): location is SharedLocation {
  return (
    !!location &&
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude) &&
    Math.abs(location.latitude) <= 90 &&
    Math.abs(location.longitude) <= 180 &&
    Number.isFinite(location.accuracy) &&
    location.accuracy >= 0
  );
}

/** Only rounded coordinates reach the place-label provider; never report IDs or tokens. */
export async function lookupPlace(
  location: SharedLocation,
  origin = "https://photon.komoot.io",
) {
  if (!validLocation(location)) return null;
  const provider = new URL(origin);
  if (
    provider.protocol !== "https:" ||
    provider.origin !== origin ||
    provider.username ||
    provider.password
  )
    throw new Error("Location service configuration unavailable");
  const latitude = location.latitude.toFixed(3),
    longitude = location.longitude.toFixed(3);
  const cache = (globalThis as unknown as { caches?: { default?: Cache } })
    .caches?.default;
  const cacheKey = new Request(
    `https://view.vaahansafe.com/__place/${encodeURIComponent(provider.hostname)}/${latitude}/${longitude}`,
  );
  const cached = await cache?.match(cacheKey);
  if (cached) return cached.json() as Promise<{ name: string; region: string }>;
  const url = new URL("/reverse", origin);
  url.search = new URLSearchParams({
    lat: latitude,
    lon: longitude,
    limit: "1",
    lang: "en",
    radius: "5",
  }).toString();
  const response = await fetch(url, {
    headers: {
      "User-Agent": "VaahanSafeView/1.0 (+https://view.vaahansafe.com)",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) throw new Error("Location name unavailable");
  const data = (await response.json()) as {
    features?: { properties?: Record<string, unknown> }[];
  };
  const p = data.features?.[0]?.properties;
  if (!p) return null;
  const clean = (value: unknown) =>
    typeof value === "string"
      ? value.replace(/[\u0000-\u001f]/g, "").slice(0, 100)
      : "";
  const distinct = (values: unknown[]) => [
    ...new Set(values.map(clean).filter(Boolean)),
  ];
  const place = {
    name: distinct([p.district || p.locality || p.name, p.city || p.county])
      .join(", ")
      .slice(0, 180),
    region: distinct([p.state, p.country]).join(", ").slice(0, 180),
  };
  if (!place.name && !place.region) return null;
  if (cache)
    await cache
      .put(
        cacheKey,
        Response.json(place, {
          headers: { "Cache-Control": "public, max-age=86400" },
        }),
      )
      .catch(() => {});
  return place;
}
