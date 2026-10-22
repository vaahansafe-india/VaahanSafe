import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { fetchParkingMap } from "../apps/customer/features/park/map-provider";

const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0]);
const place = { latitude: 28.6129, longitude: 77.2295 }; // Public India Gate landmark.
beforeEach(() => vi.stubEnv("OLA_MAPS_API_KEY", "test-provider-secret"));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("server-only Ola parking maps", () => {
  it("requests a marked Ola image with bounded dimensions and no public caching", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(png, { headers: { "Content-Type": "image/png" } }),
      );
    vi.stubGlobal("fetch", fetcher);
    const image = await fetchParkingMap(place, 16);
    expect(new Uint8Array(image)).toEqual(png);
    const [url, options] = fetcher.mock.calls[0]!;
    expect(url.origin).toBe("https://api.olamaps.io");
    expect(url.pathname).toBe(
      "/tiles/v1/styles/default-light-standard/static/77.2295,28.6129,16/800x600.png",
    );
    expect(url.searchParams.get("marker")).toBe(
      "77.2295,28.6129|green|scale:0.9",
    );
    expect(options).toMatchObject({ cache: "no-store", redirect: "error" });
  });
  it("never calls the provider with invalid coordinates, zoom or absent configuration", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    await expect(
      fetchParkingMap({ ...place, latitude: NaN }, 16),
    ).rejects.toThrow("SERVICE_UNAVAILABLE");
    await expect(fetchParkingMap(place, 30)).rejects.toThrow(
      "SERVICE_UNAVAILABLE",
    );
    vi.stubEnv("OLA_MAPS_API_KEY", "");
    await expect(fetchParkingMap(place, 16)).rejects.toThrow(
      "SERVICE_UNAVAILABLE",
    );
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("turns provider errors, redirects, non-images and oversized responses into safe failures", async () => {
    for (const response of [
      new Response("secret provider details", { status: 401 }),
      new Response("<html>error</html>", {
        headers: { "Content-Type": "text/html" },
      }),
      new Response("not a PNG", { headers: { "Content-Type": "image/png" } }),
      new Response(new Uint8Array(2_000_001), {
        headers: { "Content-Type": "image/png" },
      }),
    ]) {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
      await expect(fetchParkingMap(place, 16)).rejects.toThrow(
        "SERVICE_UNAVAILABLE",
      );
    }
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("provider URL with secret")),
    );
    await expect(fetchParkingMap(place, 16)).rejects.toThrow(
      "SERVICE_UNAVAILABLE",
    );
  });
});
