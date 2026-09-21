import { describe, it, expect } from "vitest";
import {
  SURFACES,
  ALL_SURFACE_IDS,
  getSurfaceUrl,
  getSurfaceOrigin,
  getQrUrl,
  getActivateUrl,
  getBlogUrl,
  getStatusUrl,
  getCustomerUrl,
  getAdminUrl,
  getApiUrl,
  getWebUrl,
} from "@vaahansafe/config";

describe("Domain & Multi-Surface Architecture Contracts (@vaahansafe/config)", () => {
  const EXPECTED_SURFACES = [
    "web",
    "customer",
    "activate",
    "qr",
    "admin",
    "api",
    "blog",
    "status",
  ] as const;

  describe("Surface Registry Completeness", () => {
    it("should register all 8 locked platform surfaces", () => {
      expect(ALL_SURFACE_IDS.sort()).toEqual([...EXPECTED_SURFACES].sort());
    });

    it("must NOT contain a partner portal or separate distributor portal (INVARIANT 06)", () => {
      const surfaceKeys = Object.keys(SURFACES);
      expect(surfaceKeys).not.toContain("partners");
      expect(surfaceKeys).not.toContain("distributor");
      expect(surfaceKeys).not.toContain("retailer");
    });

    it("should have correct production origins and local ports for every surface", () => {
      expect(SURFACES.web.productionOrigin).toBe("https://vaahansafe.com");
      expect(SURFACES.web.localPort).toBe(3000);

      expect(SURFACES.customer.productionOrigin).toBe("https://app.vaahansafe.com");
      expect(SURFACES.customer.localPort).toBe(3001);

      expect(SURFACES.activate.productionOrigin).toBe("https://activate.vaahansafe.com");
      expect(SURFACES.activate.localPort).toBe(3002);

      expect(SURFACES.qr.productionOrigin).toBe("https://qr.vaahansafe.com");
      expect(SURFACES.qr.localPort).toBe(3003);

      expect(SURFACES.admin.productionOrigin).toBe("https://admin.vaahansafe.com");
      expect(SURFACES.admin.localPort).toBe(3004);

      expect(SURFACES.api.productionOrigin).toBe("https://api.vaahansafe.com");
      expect(SURFACES.api.localPort).toBe(3005);

      expect(SURFACES.blog.productionOrigin).toBe("https://blog.vaahansafe.com");
      expect(SURFACES.blog.localPort).toBe(3006);

      expect(SURFACES.status.productionOrigin).toBe("https://status.vaahansafe.com");
      expect(SURFACES.status.localPort).toBe(3007);
    });

    it("should enforce strict SEO indexing policies across all surfaces", () => {
      // Public discovery surfaces must be indexed
      expect(SURFACES.web.indexingPolicy).toBe("INDEX");
      expect(SURFACES.blog.indexingPolicy).toBe("INDEX");
      expect(SURFACES.status.indexingPolicy).toBe("INDEX");

      // Protected / Safety / Operations surfaces must NEVER be indexed
      expect(SURFACES.customer.indexingPolicy).toBe("NOINDEX");
      expect(SURFACES.activate.indexingPolicy).toBe("NOINDEX");
      expect(SURFACES.qr.indexingPolicy).toBe("NOINDEX");
      expect(SURFACES.admin.indexingPolicy).toBe("NOINDEX");
      expect(SURFACES.api.indexingPolicy).toBe("NOINDEX");
    });

    it("should classify surfaces into 4 intentional architectural classes", () => {
      expect(SURFACES.web.surfaceClass).toBe("DISCOVERY");
      expect(SURFACES.blog.surfaceClass).toBe("DISCOVERY");
      expect(SURFACES.customer.surfaceClass).toBe("TRANSACTION");
      expect(SURFACES.activate.surfaceClass).toBe("TRANSACTION");
      expect(SURFACES.qr.surfaceClass).toBe("SAFETY");
      expect(SURFACES.admin.surfaceClass).toBe("OPERATIONS");
      expect(SURFACES.api.surfaceClass).toBe("OPERATIONS");
      expect(SURFACES.status.surfaceClass).toBe("OPERATIONS");
    });
  });

  describe("Cross-Surface URL Helpers & Contract Invariants", () => {
    it("should generate production URLs with owned domains", () => {
      expect(getSurfaceUrl("web", "/pricing", "production")).toBe(
        "https://vaahansafe.com/pricing"
      );
      expect(getSurfaceUrl("customer", "/dashboard", "production")).toBe(
        "https://app.vaahansafe.com/dashboard"
      );
      expect(getBlogUrl("/road-safety-2026", { env: "production" })).toBe(
        "https://blog.vaahansafe.com/road-safety-2026"
      );
      expect(getStatusUrl("/incidents", { env: "production" })).toBe(
        "https://status.vaahansafe.com/incidents"
      );
      expect(getApiUrl("/v1/health", { env: "production" })).toBe(
        "https://api.vaahansafe.com/v1/health"
      );
      expect(getAdminUrl("/inventory", { env: "production" })).toBe(
        "https://admin.vaahansafe.com/inventory"
      );
    });

    it("should resolve to local ports in development", () => {
      expect(getSurfaceUrl("web", "/pricing", "development")).toBe(
        "http://localhost:3000/pricing"
      );
      expect(getSurfaceUrl("customer", "/dashboard", "development")).toBe(
        "http://localhost:3001/dashboard"
      );
      expect(getSurfaceUrl("qr", "/7F3K9021", "development")).toBe(
        "http://localhost:3003/7F3K9021"
      );
    });

    it("must enforce the permanent printed QR contract (INVARIANT 02 & 10)", () => {
      const prodQrUrl = getQrUrl("7F3K9021", { env: "production" });
      expect(prodQrUrl).toBe("https://qr.vaahansafe.com/7F3K9021");

      // Verify that provider hostnames are never used
      expect(prodQrUrl).not.toContain("workers.dev");
      expect(prodQrUrl).not.toContain("pages.dev");
      expect(prodQrUrl).not.toContain("vercel.app");
      expect(prodQrUrl).not.toContain("localhost");
    });

    it("must reject empty or invalid publicId in getQrUrl", () => {
      expect(() => getQrUrl("")).toThrow();
      expect(() => getQrUrl("   ")).toThrow();
    });

    it("must never include scratch secrets in activation URLs (INVARIANT 03)", () => {
      const activateUrl = getActivateUrl("7F3K9021", { env: "production" });
      expect(activateUrl).toBe("https://activate.vaahansafe.com/7F3K9021");

      // Activation scratch code (e.g. 6-char alpha) must never be accepted as query param
      expect(activateUrl).not.toContain("scratch");
      expect(activateUrl).not.toContain("secret");
    });
  });
});
