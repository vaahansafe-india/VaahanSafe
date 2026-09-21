import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { getPublicSystemStatus } from "@vaahansafe/status-core";

describe("VaahanSafe Status — Public Projection, System Pulse & Zero-Leak Invariants", () => {
  const statusAppDir = path.resolve(__dirname, "../apps/status");
  const dbMigrationDir = path.resolve(__dirname, "../database/migrations");
  const cfMigrationDir = path.resolve(__dirname, "../infrastructure/cloudflare/d1/migrations");

  // --------------------------------------------------------------------------
  // 1. Zero-Leak Reporting Surface Invariants
  // --------------------------------------------------------------------------
  describe("Zero-Leak Reporting Surface Invariants", () => {
    it("Public status projection never leaks internal database IDs or provider credentials", async () => {
      const status = await getPublicSystemStatus();

      expect(status.overallState).toBeDefined();
      expect(status.services.length).toBe(6);

      for (const service of status.services) {
        // Public IDs must start with vs_srv_, never exposing raw internal row IDs
        expect(service.publicId).toMatch(/^vs_srv_/);
        expect((service as any).id).toBeUndefined();

        // Must not expose internal infrastructure terminology
        expect(service.name).not.toContain("Cloudflare");
        expect(service.name).not.toContain("D1");
        expect(service.name).not.toContain("Workers");
        expect(service.name).not.toContain("Cashfree");
        expect(service.name).not.toContain("MSG91");
      }
    });

    it("Public API route returns sanitized JSON with cache headers", async () => {
      const apiRoutePath = path.join(statusAppDir, "app/api/status/route.ts");
      expect(fs.existsSync(apiRoutePath)).toBe(true);

      const content = fs.readFileSync(apiRoutePath, "utf-8");
      expect(content).toContain("getPublicSystemStatus");
      expect(content).toContain("Cache-Control");
      expect(content).toContain("max-age=30");
    });
  });

  // --------------------------------------------------------------------------
  // 2. Signature System Pulse & Impact Field Architecture
  // --------------------------------------------------------------------------
  describe("System Pulse & Impact Field Components", () => {
    it("SystemPulse.tsx contains both desktop horizontal and mobile vertical journey rails", () => {
      const pulsePath = path.join(statusAppDir, "components/status/pulse/SystemPulse.tsx");
      expect(fs.existsSync(pulsePath)).toBe(true);

      const content = fs.readFileSync(pulsePath, "utf-8");
      expect(content).toContain("SYSTEM PULSE");
      expect(content).toContain("THE CUSTOMER SERVICE JOURNEY");
      expect(content).toContain("hidden lg:block"); // Desktop horizontal
      expect(content).toContain("block lg:hidden"); // Mobile vertical
      expect(content).toContain("JOURNEY_STAGES");
    });

    it("ImpactField.tsx renders structural breakout without generic error cards", () => {
      const impactPath = path.join(statusAppDir, "components/status/incidents/ImpactField.tsx");
      expect(fs.existsSync(impactPath)).toBe(true);

      const content = fs.readFileSync(impactPath, "utf-8");
      expect(content).toContain("ACTIVE INCIDENT");
      expect(content).toContain("AFFECTED CAPABILITY");
      expect(content).toContain("LATEST UPDATE");
    });

    it("ReliabilityField.tsx avoids synthetic 99.99% percentages and provides accessible text summary", () => {
      const historyPath = path.join(statusAppDir, "components/status/history/ReliabilityField.tsx");
      expect(fs.existsSync(historyPath)).toBe(true);

      const content = fs.readFileSync(historyPath, "utf-8");
      expect(content).toContain("RELIABILITY / RECORDED HISTORY");
      expect(content).toContain("NO SYNTHETIC RATINGS");
      expect(content).toContain("sr-only"); // Accessible summary
      expect(content).not.toContain("99.99%");
    });
  });

  // --------------------------------------------------------------------------
  // 3. Error and Isolation States
  // --------------------------------------------------------------------------
  describe("Status Surface Error & Network States", () => {
    it("not-found.tsx renders 404 UNKNOWN SIGNAL with signal rail", () => {
      const notFoundPath = path.join(statusAppDir, "app/not-found.tsx");
      expect(fs.existsSync(notFoundPath)).toBe(true);

      const content = fs.readFileSync(notFoundPath, "utf-8");
      expect(content).toContain("ERROR / 404");
      expect(content).toContain("UNKNOWN SIGNAL");
      expect(content).toContain("404");
      expect(content).toContain("This status page could not be found");
    });

    it("error.tsx explicitly distinguishes status surface failure from platform health", () => {
      const errorPath = path.join(statusAppDir, "app/error.tsx");
      expect(fs.existsSync(errorPath)).toBe(true);

      const content = fs.readFileSync(errorPath, "utf-8");
      expect(content).toContain("SYSTEM / 500");
      expect(content).toContain("STATUS UNAVAILABLE");
      expect(content).toContain("Current status information could not be loaded");
      expect(content).toContain("does not imply that core VaahanSafe vehicle QR access");
    });

    it("global-error.tsx is a self-contained root boundary with zero dependencies", () => {
      const globalErrorPath = path.join(statusAppDir, "app/global-error.tsx");
      expect(fs.existsSync(globalErrorPath)).toBe(true);

      const content = fs.readFileSync(globalErrorPath, "utf-8");
      expect(content).toContain("<html");
      expect(content).toContain("<body");
      expect(content).toContain("VAAHANSAFE / STATUS");
      expect(content).toContain("STATUS SURFACE UNAVAILABLE");
    });
  });

  // --------------------------------------------------------------------------
  // 4. Migration & Schema Parity
  // --------------------------------------------------------------------------
  describe("D1 Status Migration Integrity", () => {
    it("Migration 0012 exists in both database/migrations and infrastructure/cloudflare/d1/migrations", () => {
      const dbFile = path.join(dbMigrationDir, "0012_status_pulse_and_incidents.sql");
      const cfFile = path.join(cfMigrationDir, "0012_status_pulse_and_incidents.sql");

      expect(fs.existsSync(dbFile)).toBe(true);
      expect(fs.existsSync(cfFile)).toBe(true);

      const dbContent = fs.readFileSync(dbFile, "utf-8");
      const cfContent = fs.readFileSync(cfFile, "utf-8");

      expect(dbContent).toBe(cfContent);
      expect(dbContent).toContain("status_services");
      expect(dbContent).toContain("status_incidents");
      expect(dbContent).toContain("status_maintenance");
      expect(dbContent).toContain("journey_stage");
    });
  });
});
