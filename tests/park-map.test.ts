import { afterEach, describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { parkingGoogleEmbedUrl } from "../apps/customer/features/park/map-provider";
import { parkingMapType } from "../apps/customer/features/park/model";
const place = { latitude: 28.6129, longitude: 77.2295 }; // Public landmark.
afterEach(() => vi.unstubAllEnvs());
describe("Google parking embeds", () => {
  it("uses only the restricted Embed credential and the saved GPS point", () => {
    vi.stubEnv("GOOGLE_MAPS_EMBED_API_KEY", "browser-embed-key");
    vi.stubEnv("OLA_MAPS_API_KEY", "private-server-key");
    const url = new URL(parkingGoogleEmbedUrl(place, 16, "satellite"));
    expect(url.origin + url.pathname).toBe(
      "https://www.google.com/maps/embed/v1/place",
    );
    expect(Object.fromEntries(url.searchParams)).toEqual({
      key: "browser-embed-key",
      q: "28.6129,77.2295",
      center: "28.6129,77.2295",
      zoom: "16",
      maptype: "satellite",
      language: "en",
      region: "IN",
    });
    expect(url.toString()).not.toContain("private-server-key");
  });
  it("does not fall back to the private Ola credential or fabricate a map", () => {
    vi.stubEnv("GOOGLE_MAPS_EMBED_API_KEY", "");
    vi.stubEnv("OLA_MAPS_API_KEY", "private-server-key");
    expect(() => parkingGoogleEmbedUrl(place, 16, "roadmap")).toThrow(
      "SERVICE_UNAVAILABLE",
    );
  });
  it("rejects invalid saved coordinates, zoom and arbitrary map modes", () => {
    vi.stubEnv("GOOGLE_MAPS_EMBED_API_KEY", "browser-embed-key");
    for (const point of [
      { latitude: NaN, longitude: 77 },
      { latitude: 91, longitude: 77 },
      { latitude: 28, longitude: Infinity },
      { latitude: 28, longitude: -181 },
    ])
      expect(() => parkingGoogleEmbedUrl(point, 16, "roadmap")).toThrow(
        "SERVICE_UNAVAILABLE",
      );
    for (const zoom of [11, 20, 16.5, NaN])
      expect(() => parkingGoogleEmbedUrl(place, zoom, "roadmap")).toThrow(
        "SERVICE_UNAVAILABLE",
      );
    expect(parkingMapType(null)).toBe("roadmap");
    expect(parkingMapType("satellite")).toBe("satellite");
    for (const type of [
      "streetview",
      "https://example.com",
      "satellite&key=bad",
      "",
    ])
      expect(() => parkingMapType(type)).toThrow("INVALID_INPUT");
  });
});
