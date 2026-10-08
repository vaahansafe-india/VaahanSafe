import { describe, it, expect, vi, afterEach } from "vitest";
import { CloudflareR2RestClient } from "../packages/storage/src/r2/cloudflare-r2-rest-store";
afterEach(() => vi.unstubAllGlobals());
describe("R2 metadata lookup", () => {
  it("uses the documented metadata listing endpoint with an exact key match", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            result: [
              {
                key: "assets/paper.png",
                size: 19,
                etag: "etag",
                last_modified: "2026-10-03T00:00:00Z",
                http_metadata: { contentType: "image/png" },
              },
            ],
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetcher);
    const store = new CloudflareR2RestClient({
      accountId: "test-account",
      apiToken: "test-only-token",
      bucketName: "test-bucket",
    });
    const meta = await store.head("assets/paper.png");
    const [url, options] = fetcher.mock.calls[0]!;
    expect(String(url)).toContain(
      "/objects?prefix=assets%2Fpaper.png&per_page=1",
    );
    expect(options.method).toBe("GET");
    expect(meta?.size).toBe(19);
    expect(meta?.contentType).toBe("image/png");
  });
  it("does not mistake a prefix sibling for the requested object", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({
              success: true,
              result: [{ key: "assets/paper.png.backup" }],
            }),
            { status: 200 },
          ),
        ),
    );
    const store = new CloudflareR2RestClient({
      accountId: "test-account",
      apiToken: "test-only-token",
      bucketName: "test-bucket",
    });
    expect(await store.head("assets/paper.png")).toBeNull();
  });
  it("rejects provider errors rather than returning fake connectivity", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ success: false }), { status: 200 }),
        ),
    );
    const store = new CloudflareR2RestClient({
      accountId: "test-account",
      apiToken: "test-only-token",
      bucketName: "test-bucket",
    });
    await expect(store.head("key")).rejects.toThrow();
  });
});
