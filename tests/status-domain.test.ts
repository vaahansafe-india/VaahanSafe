import { describe, it, expect, vi } from "vitest";
import {
  JOURNEY_STAGES,
  SERVICE_STATE_CONFIG,
  deriveOverallStatus,
  formatIstTimestamp,
  StatusRepository,
  BASELINE_SERVICES,
  getPublicSystemStatus,
  PublicStatusServiceDto,
} from "@vaahansafe/status-core/server";

describe("VaahanSafe Status Domain & System Pulse Evaluation", () => {
  // --------------------------------------------------------------------------
  // 1. Customer Journey Topology
  // --------------------------------------------------------------------------
  describe("Customer Journey Topology Invariants", () => {
    it("Defines the exact 6 sequential journey stages from DISCOVER to CONNECT", () => {
      const stages = JOURNEY_STAGES.map((j) => j.stage);
      expect(stages).toEqual([
        "DISCOVER",
        "ACCOUNT",
        "ACQUIRE",
        "ACTIVATE",
        "SCAN",
        "CONNECT",
      ]);
    });

    it("Maps each journey stage to its corresponding public customer capability", () => {
      const stageMap = new Map(JOURNEY_STAGES.map((j) => [j.stage, j.serviceSlug]));
      expect(stageMap.get("DISCOVER")).toBe("website");
      expect(stageMap.get("ACCOUNT")).toBe("customer-app");
      expect(stageMap.get("ACQUIRE")).toBe("payments");
      expect(stageMap.get("ACTIVATE")).toBe("retail-activation");
      expect(stageMap.get("SCAN")).toBe("vehicle-qr-access");
      expect(stageMap.get("CONNECT")).toBe("notifications");
    });
  });

  // --------------------------------------------------------------------------
  // 2. Aggregate Status Derivation & Precedence
  // --------------------------------------------------------------------------
  describe("Aggregate Status Evaluation Precedence", () => {
    const createServices = (overrides: Partial<Record<string, any>> = {}): PublicStatusServiceDto[] => {
      return BASELINE_SERVICES.map((s) => ({
        ...s,
        state: overrides[s.slug] || "OPERATIONAL",
      }));
    };

    it("Rule 1: Evaluates to OPERATIONAL when all capabilities are healthy", () => {
      const services = createServices();
      const result = deriveOverallStatus(services);

      expect(result.overallState).toBe("OPERATIONAL");
      expect(result.headline).toContain("operating normally");
    });

    it("Rule 2: MAJOR OUTAGE takes highest priority over partial or degraded", () => {
      const services = createServices({
        "vehicle-qr-access": "MAJOR OUTAGE",
        "retail-activation": "DEGRADED",
      });
      const result = deriveOverallStatus(services);

      expect(result.overallState).toBe("MAJOR OUTAGE");
      expect(result.headline).toContain("unavailable");
      expect(result.description).toContain("Vehicle QR Access");
    });

    it("Rule 3: PARTIAL OUTAGE takes priority over degraded and maintenance", () => {
      const services = createServices({
        payments: "PARTIAL OUTAGE",
        "customer-app": "DEGRADED",
        website: "MAINTENANCE",
      });
      const result = deriveOverallStatus(services);

      expect(result.overallState).toBe("PARTIAL OUTAGE");
      expect(result.headline).toContain("Partial service interruption");
      expect(result.description).toContain("Purchase & Payments");
    });

    it("Rule 4: DEGRADED takes priority over maintenance and operational", () => {
      const services = createServices({
        "retail-activation": "DEGRADED",
        website: "MAINTENANCE",
      });
      const result = deriveOverallStatus(services);

      expect(result.overallState).toBe("DEGRADED");
      expect(result.headline).toContain("disruption");
      expect(result.description).toContain("Retail Activation");
    });

    it("Rule 5: MAINTENANCE is reflected when no outages or degradations exist", () => {
      const services = createServices({
        website: "MAINTENANCE",
      });
      const result = deriveOverallStatus(services);

      expect(result.overallState).toBe("MAINTENANCE");
      expect(result.headline).toContain("maintenance in progress");
    });

    it("Rule 6: Empty services or stale data evaluates strictly to UNKNOWN", () => {
      const emptyResult = deriveOverallStatus([]);
      expect(emptyResult.overallState).toBe("UNKNOWN");
      expect(emptyResult.headline).toContain("could not be confirmed");

      const staleResult = deriveOverallStatus(createServices(), true);
      expect(staleResult.overallState).toBe("UNKNOWN");
      expect(staleResult.headline).toContain("could not be confirmed");
    });
  });

  // --------------------------------------------------------------------------
  // 3. IST Time Formatting
  // --------------------------------------------------------------------------
  describe("IST Time Formatting Invariants", () => {
    it("Formats timestamps into canonical Indian Standard Time (IST)", () => {
      // 2026-09-21T07:06:00Z is 12:36 IST (+5:30)
      const formatted = formatIstTimestamp("2026-09-21T07:06:00Z");
      expect(formatted).toContain("IST");
      expect(formatted).toContain("2026");
      expect(formatted).toContain("12:36");
    });

    it("Gracefully handles invalid timestamps without throwing", () => {
      const result = formatIstTimestamp("invalid-date-string");
      expect(result).toBe("Unknown Time");
    });
  });

  // --------------------------------------------------------------------------
  // 4. Status Repository & Failure Isolation
  // --------------------------------------------------------------------------
  describe("Status Repository Failure Isolation", () => {
    it("Returns baseline customer journey topology if D1 is not provided", async () => {
      const repo = new StatusRepository();
      const services = await repo.getPublicServices();

      expect(services.length).toBe(6);
      expect(services.map((s) => s.journeyStage)).toEqual([
        "DISCOVER",
        "ACCOUNT",
        "ACQUIRE",
        "ACTIVATE",
        "SCAN",
        "CONNECT",
      ]);
    });

    it("does not invent operational days without complete observations", async () => {
      const repo = new StatusRepository();
      const history = (await repo.getServiceHistories(["vehicle-qr-access"], 90, new Date("2026-10-03T12:00:00Z")))[0]!;

      expect(history.serviceSlug).toBe("vehicle-qr-access");
      expect(history.recordedDaysCount).toBe(0);
      expect(history.sourceAvailable).toBe(false);
      expect(history.days).toHaveLength(90);
      expect(history.days.every((day) => day.state === "UNKNOWN" && day.checks === 0)).toBe(true);
      expect(history.observedSuccessPercent).toBeNull();
    });

    it("aggregates only recorded checks into IST days and keeps missing days unknown", async () => {
      const repo = new StatusRepository({
        query: async () => [{
          service_slug: "website", day: "2026-10-03", checks: 3,
          successful_checks: 2, degraded_checks: 1, failed_checks: 0,
        }],
        queryFirst: async () => ({ name: "status_probe_samples" }),
      });
      const history = (await repo.getServiceHistories(["website"], 3, new Date("2026-10-03T12:00:00Z")))[0]!;
      expect(history.days.map((day) => day.state)).toEqual(["UNKNOWN", "UNKNOWN", "DEGRADED"]);
      expect(history.totalChecks).toBe(3);
      expect(history.observedSuccessPercent).toBe(66.67);
      expect(history.recordedDaysCount).toBe(1);
    });

    it("does not report an unreadable incident archive as an empty archive", async () => {
      await expect(new StatusRepository().getIncidentHistory()).rejects.toThrow("unavailable");
      await expect(new StatusRepository().getIncidentBySlug("report")).rejects.toThrow("unavailable");
    });

    it("reflects a published critical incident even when its seeded service state is operational", async () => {
      const envNames = ["STATUS_WEB_HEALTH_URL", "STATUS_APP_HEALTH_URL", "STATUS_ACTIVATE_HEALTH_URL", "STATUS_QR_HEALTH_URL", "STATUS_PAYMENTS_HEALTH_URL", "STATUS_NOTIFICATIONS_HEALTH_URL", "SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY"];
      for (const name of envNames) vi.stubEnv(name, "");
      try {
        const status = await getPublicSystemStatus({
          query: async (sql: string) => sql.includes("FROM status_incidents i") ? [{
            id: "inc_1", public_id: "vs_inc_1", slug: "incident", title: "QR incident",
            summary: "QR access interrupted", state: "INVESTIGATING", impact: "CRITICAL",
            started_at: "2026-10-03T12:00:00Z", resolved_at: null,
            affected_service_slugs: "vehicle-qr-access",
          }] : [],
          queryFirst: async () => null,
        });
        expect(status.services.find((service) => service.slug === "vehicle-qr-access")?.state).toBe("MAJOR OUTAGE");
        expect(status.overallState).toBe("MAJOR OUTAGE");
      } finally {
        vi.unstubAllEnvs();
      }
    });
  });
});
