import { describe, it, expect } from "vitest";
import {
  BINDING_NAMES,
  getD1DatabaseName,
  getR2BucketName,
  getQueueName,
  getRuntimeEnvironment,
  assertNonProduction,
  assertProduction,
  assertProviderModeSafety,
} from "@vaahansafe/config";

describe("Cloudflare Environment Architecture & Naming Contract (@vaahansafe/config)", () => {
  describe("Stable Application Binding Contract (INVARIANT 06)", () => {
    it("should export all locked stable binding identifiers", () => {
      expect(BINDING_NAMES.DB).toBe("DB");
      expect(BINDING_NAMES.PUBLIC_STORAGE).toBe("PUBLIC_STORAGE");
      expect(BINDING_NAMES.PRIVATE_STORAGE).toBe("PRIVATE_STORAGE");
      expect(BINDING_NAMES.EXPORT_STORAGE).toBe("EXPORT_STORAGE");
      expect(BINDING_NAMES.NOTIFICATION_QUEUE).toBe("NOTIFICATION_QUEUE");
      expect(BINDING_NAMES.ANALYTICS_QUEUE).toBe("ANALYTICS_QUEUE");
      expect(BINDING_NAMES.COMMERCE_QUEUE).toBe("COMMERCE_QUEUE");
    });
  });

  describe("Deterministic Resource Naming", () => {
    it("should generate deterministic, environment-qualified D1 database names", () => {
      expect(getD1DatabaseName("development")).toBe("vaahansafe-dev-db");
      expect(getD1DatabaseName("staging")).toBe("vaahansafe-staging-db");
      expect(getD1DatabaseName("production")).toBe("vaahansafe-prod-db");
    });

    it("should generate deterministic, environment-qualified R2 bucket names", () => {
      expect(getR2BucketName("public", "development")).toBe("vaahansafe-dev-public");
      expect(getR2BucketName("private", "staging")).toBe("vaahansafe-staging-private");
      expect(getR2BucketName("exports", "production")).toBe("vaahansafe-prod-exports");
    });

    it("should generate deterministic, environment-qualified Queue names", () => {
      expect(getQueueName("notifications", "development")).toBe("vaahansafe-dev-notifications");
      expect(getQueueName("analytics", "staging")).toBe("vaahansafe-staging-analytics-events");
      expect(getQueueName("commerce", "production")).toBe("vaahansafe-prod-commerce-events");
      expect(getQueueName("dlq", "production")).toBe("vaahansafe-prod-dlq");
    });
  });

  describe("Provider Mode & Environment Guardrails (INVARIANT 14)", () => {
    it("should allow mock and sandbox modes in non-production environments", () => {
      expect(() => assertProviderModeSafety("local", "mock")).not.toThrow();
      expect(() => assertProviderModeSafety("development", "sandbox")).not.toThrow();
      expect(() => assertProviderModeSafety("staging", "sandbox")).not.toThrow();
    });

    it("should throw security error if live provider mode is loaded in non-production", () => {
      expect(() => assertProviderModeSafety("local", "live")).toThrow(
        /Security Invariant Violation/
      );
      expect(() => assertProviderModeSafety("development", "live")).toThrow(
        /Security Invariant Violation/
      );
      expect(() => assertProviderModeSafety("staging", "live")).toThrow(
        /Security Invariant Violation/
      );
    });

    it("should require live provider mode in production environment", () => {
      expect(() => assertProviderModeSafety("production", "live")).not.toThrow();
      expect(() => assertProviderModeSafety("production", "sandbox")).toThrow(
        /Configuration Error/
      );
      expect(() => assertProviderModeSafety("production", "mock")).toThrow(
        /Configuration Error/
      );
    });

    it("assertNonProduction throws error if called in production", () => {
      expect(() => assertNonProduction("development", "seedDatabase")).not.toThrow();
      expect(() => assertNonProduction("production", "resetDatabase")).toThrow(
        /Security Invariant Violation/
      );
    });

    it("assertProduction throws error if called in non-production", () => {
      expect(() => assertProduction("production", "deployLiveWorker")).not.toThrow();
      expect(() => assertProduction("staging", "deployLiveWorker")).toThrow(
        /Configuration Error/
      );
    });
  });
});
