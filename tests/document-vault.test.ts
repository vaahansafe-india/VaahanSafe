import { afterEach, describe, it, expect, vi } from "vitest";
import {
  detectMime,
  safeFilename,
  validity,
  MAX_FILE_BYTES,
} from "../apps/customer/features/document-vault/model";
import {
  handleRequest,
  type VaultEnv,
} from "../infrastructure/cloudflare/workers/document-vault/src/index";
const token = "a".repeat(43),
  origin = "https://app.vaahansafe.com";
const png = new Uint8Array([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
]);
function env() {
  return {
    SUPABASE_URL: "https://database.invalid",
    SUPABASE_SERVICE_ROLE_KEY: "unit-test-only",
    CUSTOMER_ORIGIN: origin,
    DOCUMENT_STORAGE: {
      put: vi.fn().mockResolvedValue({}),
      get: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  } satisfies VaultEnv;
}
function mockRpc(steps: Record<string, unknown>[]) {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push(String(url).split("/").at(-1)!);
      const step = steps.shift();
      if (!step) throw new Error("Unexpected RPC");
      return Response.json(step);
    }),
  );
  return calls;
}
function upload(bytes: Uint8Array = png) {
  const form = new FormData();
  form.set(
    "file",
    new File([bytes as BlobPart], "legal.png", { type: "image/png" }),
  );
  return new Request(`https://worker.invalid/uploads/${token}`, {
    method: "PUT",
    headers: { Origin: origin },
    body: form,
  });
}
afterEach(() => vi.unstubAllGlobals());
describe("Document Vault file and validity policy", () => {
  it("requires signatures rather than extensions or declared MIME", () => {
    expect(
      detectMime(new TextEncoder().encode("<html>evil.pdf</html>")),
    ).toBeNull();
    expect(detectMime(png)).toBe("image/png");
    expect(detectMime(new TextEncoder().encode("%PDF-1.7\nobjects"))).toBe(
      "application/pdf",
    );
    expect(detectMime(new Uint8Array(8))).toBeNull();
    expect(MAX_FILE_BYTES).toBe(20971520);
  });
  it("uses the India calendar day and explicit expiry boundaries", () => {
    const now = new Date("2026-10-09T20:00:00Z");
    expect(validity("2026-10-09", now).key).toBe("EXPIRED");
    expect(validity("2026-10-10", now).label).toBe("Expires today");
    expect(validity("2026-11-09", now).key).toBe("EXPIRING_SOON");
    expect(validity("2026-11-10", now).key).toBe("VALID");
    expect(validity(null, now).key).toBe("NO_EXPIRY");
  });
  it("normalizes unsafe file path and header characters", () => {
    expect(safeFilename("../a\r\nb\\c.pdf")).not.toMatch(/[\r\n/\\]/);
    expect(safeFilename("x".repeat(500))).toHaveLength(160);
  });
});
describe("Private Cloudflare document gateway", () => {
  it.each([origin, "http://localhost:3001"])(
    "permits preflight from the configured origin %s without touching data",
    async (allowed) => {
      const e = {
        ...env(),
        CUSTOMER_ADDITIONAL_ORIGINS: "http://localhost:3001",
      };
      const fetch = vi.fn();
      vi.stubGlobal("fetch", fetch);
      const response = await handleRequest(
        new Request(`https://worker.invalid/uploads/${token}`, {
          method: "OPTIONS",
          headers: {
            Origin: allowed,
            "Access-Control-Request-Method": "PUT",
            "Access-Control-Request-Headers": "content-type",
          },
        }),
        e,
      );
      expect(response.status).toBe(204);
      expect(response.headers.get("access-control-allow-origin")).toBe(allowed);
      expect(response.headers.get("access-control-allow-methods")).toContain(
        "PUT",
      );
      expect(response.headers.get("access-control-allow-headers")).toContain(
        "Content-Type",
      );
      expect(response.headers.get("vary")).toBe("Origin");
      expect(fetch).not.toHaveBeenCalled();
    },
  );
  it.each([
    "http://localhost:3002",
    "http://localhost:3001.attacker.invalid",
    "https://untrusted.invalid",
  ])("denies an origin outside the exact allowlist: %s", async (foreign) => {
    const e = {
      ...env(),
      CUSTOMER_ADDITIONAL_ORIGINS: "http://localhost:3001",
    };
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const response = await handleRequest(
      new Request(`https://worker.invalid/uploads/${token}`, {
        method: "OPTIONS",
        headers: { Origin: foreign, "Access-Control-Request-Method": "PUT" },
      }),
      e,
    );
    expect(response.status).toBe(403);
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("allows localhost PUT through CORS while still rejecting an expired upload capability", async () => {
    const e = {
      ...env(),
      CUSTOMER_ADDITIONAL_ORIGINS: "http://localhost:3001",
    };
    mockRpc([{ error: "EXPIRED" }]);
    const request = upload();
    request.headers.set("Origin", "http://localhost:3001");
    const response = await handleRequest(request, e);
    expect(response.status).toBe(409);
    expect(response.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:3001",
    );
    expect(e.DOCUMENT_STORAGE.put).not.toHaveBeenCalled();
  });
  it("blocks foreign origins before reading storage or metadata", async () => {
    const e = env();
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const response = await handleRequest(
      new Request(`https://worker.invalid/access/${token}`, {
        headers: { Origin: "https://attacker.invalid" },
      }),
      e,
    );
    expect(response.status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
    expect(e.DOCUMENT_STORAGE.get).not.toHaveBeenCalled();
  });
  it("never opens R2 for an expired or revoked access grant", async () => {
    const e = env();
    mockRpc([{ error: "EXPIRED" }]);
    const response = await handleRequest(
      new Request(`https://worker.invalid/access/${token}`),
      e,
    );
    expect(response.status).toBe(403);
    expect(e.DOCUMENT_STORAGE.get).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it("denies a locked vault before reading any original or thumbnail from R2", async () => {
    const e = env();
    mockRpc([{ error: "LOCKED" }]);
    const response = await handleRequest(
      new Request(`https://worker.invalid/access/${token}`, {
        headers: { Origin: origin, Range: "bytes=0-10" },
      }),
      e,
    );
    expect(response.status).toBe(403);
    expect(e.DOCUMENT_STORAGE.get).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it("rejects an upload denied by vault protection without storing file bytes", async () => {
    const e = env();
    const calls = mockRpc([{ error: "EXPIRED" }]);
    const response = await handleRequest(upload(), e);
    expect(response.status).toBe(409);
    expect(e.DOCUMENT_STORAGE.put).not.toHaveBeenCalled();
    expect(calls).toEqual(["vault_transfer"]);
  });
  it("streams authorized content with restrictive headers and range support", async () => {
    const e = env();
    e.DOCUMENT_STORAGE.get.mockResolvedValue({
      body: new Blob(["data"]).stream(),
      size: 10,
      httpEtag: "etag",
      range: { offset: 2, length: 4 },
    });
    mockRpc([
      {
        key: "server-only-key",
        mime: "application/pdf",
        kind: "preview",
        filename: "x\r\n.pdf",
      },
    ]);
    const response = await handleRequest(
      new Request(`https://worker.invalid/access/${token}`, {
        headers: { Origin: origin, Range: "bytes=2-5" },
      }),
      e,
    );
    expect(response.status).toBe(206);
    expect(response.headers.get("content-range")).toBe("bytes 2-5/10");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("access-control-allow-origin")).toBe(origin);
    expect(response.headers.get("content-disposition")).not.toContain("\r");
    expect(await response.text()).toBe("data");
  });
  it("replays confirmed uploads without overwriting their objects", async () => {
    const e = env();
    mockRpc([{ ready: true, id: "document" }]);
    const response = await handleRequest(upload(), e);
    expect(response.status).toBe(200);
    expect(e.DOCUMENT_STORAGE.put).not.toHaveBeenCalled();
  });
  it("validates bytes before uploading and marks the lease failed safely", async () => {
    const e = env();
    const calls = mockRpc([
      {
        key: "server-only-key",
        size: png.length,
        mime: "application/pdf",
        lease: "lease",
      },
      { status: "FAILED" },
    ]);
    const response = await handleRequest(upload(), e);
    expect(response.status).toBe(503);
    expect(e.DOCUMENT_STORAGE.put).not.toHaveBeenCalled();
    expect(calls).toEqual(["vault_transfer", "vault_fail_upload"]);
  });
  it("preserves objects after ambiguous database finalization", async () => {
    const e = env();
    const calls = mockRpc([
      {
        key: "server-only-key",
        size: png.length,
        mime: "image/png",
        lease: "lease",
      },
    ]);
    const response = await handleRequest(upload(), e);
    expect(response.status).toBe(503);
    expect(e.DOCUMENT_STORAGE.put).toHaveBeenCalledOnce();
    expect(e.DOCUMENT_STORAGE.delete).not.toHaveBeenCalled();
    expect(calls).toEqual(["vault_transfer", "vault_transfer"]);
  });
  it("publishes READY only after a real storage write and DB confirmation", async () => {
    const e = env();
    mockRpc([
      {
        key: "server-only-key",
        size: png.length,
        mime: "image/png",
        lease: "lease",
      },
      { ready: true, id: "document" },
    ]);
    const response = await handleRequest(upload(), e);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ready: true, id: "document" });
    expect(e.DOCUMENT_STORAGE.put).toHaveBeenCalledOnce();
  });
});
