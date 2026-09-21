import { describe, it, expect } from "vitest";
import {
  validateResourceCrossover,
  isBindingAllowedForSurface,
  assertBindingAllowedForSurface,
  SURFACE_BINDINGS_MATRIX,
} from "@vaahansafe/config";

describe("Cloudflare Resource Crossover & Least-Privilege Matrix (@vaahansafe/config)", () => {
  describe("Resource Crossover Validation (INVARIANTS 01–03)", () => {
    it("should pass when all resource names match the target environment tier", () => {
      const prodResources = [
        "vaahansafe-prod-db",
        "vaahansafe-prod-public",
        "vaahansafe-prod-commerce-events",
      ];
      const prodResult = validateResourceCrossover("production", prodResources);
      expect(prodResult.isValid).toBe(true);
      expect(prodResult.errors).toHaveLength(0);

      const devResources = [
        "vaahansafe-dev-db",
        "vaahansafe-dev-public",
        "vaahansafe-dev-notifications",
      ];
      const devResult = validateResourceCrossover("development", devResources);
      expect(devResult.isValid).toBe(true);
    });

    it("should flag an error if production environment references -dev- or -staging- resources", () => {
      const mixedProd = [
        "vaahansafe-prod-db",
        "vaahansafe-dev-public", // ACCIDENTAL CROSSOVER
        "vaahansafe-staging-notifications", // ACCIDENTAL CROSSOVER
      ];

      const result = validateResourceCrossover("production", mixedProd);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain("non-production resource");
    });

    it("should flag an error if staging environment references -prod- resources", () => {
      const mixedStaging = [
        "vaahansafe-staging-db",
        "vaahansafe-prod-private", // ACCIDENTAL PRODUCTION LEAKAGE
      ];

      const result = validateResourceCrossover("staging", mixedStaging);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("references production resource");
    });

    it("should flag an error if development environment references -prod- resources", () => {
      const mixedDev = ["vaahansafe-dev-db", "vaahansafe-prod-db"];
      const result = validateResourceCrossover("development", mixedDev);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe("Surface Least-Privilege Binding Matrix (INVARIANTS 07, 08, 16)", () => {
    it("QR surface should bind ONLY to DB and ANALYTICS_QUEUE", () => {
      expect(isBindingAllowedForSurface("qr", "DB")).toBe(true);
      expect(isBindingAllowedForSurface("qr", "ANALYTICS_QUEUE")).toBe(true);

      // Forbidden bindings for QR
      expect(isBindingAllowedForSurface("qr", "PUBLIC_STORAGE")).toBe(false);
      expect(isBindingAllowedForSurface("qr", "PRIVATE_STORAGE")).toBe(false);
      expect(isBindingAllowedForSurface("qr", "EXPORT_STORAGE")).toBe(false);
      expect(isBindingAllowedForSurface("qr", "NOTIFICATION_QUEUE")).toBe(false);
      expect(isBindingAllowedForSurface("qr", "COMMERCE_QUEUE")).toBe(false);

      expect(() => assertBindingAllowedForSurface("qr", "COMMERCE_QUEUE")).toThrow(
        /Least-Privilege Violation/
      );
    });

    it("Status surface must NOT bind to DB or storage (INVARIANT 16)", () => {
      expect(isBindingAllowedForSurface("status", "DB")).toBe(false);
      expect(isBindingAllowedForSurface("status", "PUBLIC_STORAGE")).toBe(false);
      expect(isBindingAllowedForSurface("status", "PRIVATE_STORAGE")).toBe(false);
      expect(isBindingAllowedForSurface("status", "NOTIFICATION_QUEUE")).toBe(false);
    });

    it("Web marketing surface should only access PUBLIC_STORAGE", () => {
      expect(isBindingAllowedForSurface("web", "PUBLIC_STORAGE")).toBe(true);
      expect(isBindingAllowedForSurface("web", "DB")).toBe(false);
      expect(isBindingAllowedForSurface("web", "PRIVATE_STORAGE")).toBe(false);
      expect(isBindingAllowedForSurface("web", "NOTIFICATION_QUEUE")).toBe(false);
    });

    it("Activate surface should access DB and NOTIFICATION_QUEUE only", () => {
      expect(isBindingAllowedForSurface("activate", "DB")).toBe(true);
      expect(isBindingAllowedForSurface("activate", "NOTIFICATION_QUEUE")).toBe(true);
      expect(isBindingAllowedForSurface("activate", "PRIVATE_STORAGE")).toBe(false);
      expect(isBindingAllowedForSurface("activate", "COMMERCE_QUEUE")).toBe(false);
    });

    it("verifies QR surface allowedSecrets is strictly empty (INVARIANT 08)", () => {
      expect(SURFACE_BINDINGS_MATRIX.qr.allowedSecrets).toEqual([]);
    });
  });
});
