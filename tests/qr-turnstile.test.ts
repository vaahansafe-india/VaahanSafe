import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyScanReportTurnstile } from "../apps/qr/lib/verify-scan-report-turnstile";

const options = {
  token: "unit-test-challenge",
  secret: "unit-test-secret",
  requestHostname: "qr.vaahansafe.com",
  hostnames: "qr.vaahansafe.com",
  production: true,
};
afterEach(() => vi.unstubAllGlobals());

describe("QR report Turnstile boundary", () => {
  it.each(["", " ", "a".repeat(2049), null, new Blob(["file"])])(
    "rejects malformed tokens before verification",
    async (token) => {
      const fetcher = vi.fn();
      vi.stubGlobal("fetch", fetcher);
      expect(await verifyScanReportTurnstile({ ...options, token })).toBe(
        false,
      );
      expect(fetcher).not.toHaveBeenCalled();
    },
  );
  it.each([
    "",
    "localhost,qr.vaahansafe.com",
    "127.0.0.1,qr.vaahansafe.com",
    "another.example",
  ])(
    "rejects an unsafe or mismatched production hostname configuration",
    async (hostnames) => {
      const fetcher = vi.fn();
      vi.stubGlobal("fetch", fetcher);
      expect(await verifyScanReportTurnstile({ ...options, hostnames })).toBe(
        false,
      );
      expect(fetcher).not.toHaveBeenCalled();
    },
  );
  it.each([
    { success: true, action: "login", hostname: "qr.vaahansafe.com" },
    { success: true, action: "scan-report", hostname: "localhost" },
    { success: "true", action: "scan-report", hostname: "qr.vaahansafe.com" },
    { success: false, "error-codes": ["timeout-or-duplicate"] },
    null,
  ])("rejects incorrect bindings and replay responses", async (result) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify(result))),
    );
    expect(await verifyScanReportTurnstile(options)).toBe(false);
  });
  it("allows only a successful matching challenge and rejects replay", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            action: "scan-report",
            hostname: "qr.vaahansafe.com",
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            "error-codes": ["timeout-or-duplicate"],
          }),
        ),
      );
    vi.stubGlobal("fetch", fetcher);
    expect(await verifyScanReportTurnstile(options)).toBe(true);
    expect(await verifyScanReportTurnstile(options)).toBe(false);
    const [url, request] = fetcher.mock.calls[0]!;
    expect(url).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    );
    expect(request.method).toBe("POST");
    expect(request.body.get("response")).toBe(options.token);
  });
  it("permits the configured localhost only in development", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({
              success: true,
              action: "scan-report",
              hostname: "localhost",
            }),
          ),
        ),
    );
    expect(
      await verifyScanReportTurnstile({
        ...options,
        hostnames: "localhost",
        requestHostname: "localhost",
        production: false,
      }),
    ).toBe(true);
  });
  it.each([
    new Response("unavailable", { status: 503 }),
    new Response("invalid JSON"),
  ])("fails closed for invalid upstream responses", async (response) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
    expect(await verifyScanReportTurnstile(options)).toBe(false);
  });
  it("fails closed when Cloudflare cannot be reached", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network error")),
    );
    expect(await verifyScanReportTurnstile(options)).toBe(false);
  });
});
