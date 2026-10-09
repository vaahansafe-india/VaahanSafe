import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  formatRelativeAge,
  formatIstTimestamp,
  formatHumanReference,
  getStatusSemantic,
  formatCurrencyMinor,
  getGreetingForIstHour,
} from "../apps/admin/features/dashboard/presentation";
import {
  MetricStrip,
  AttentionPanel,
  ActivityPulse,
  OperationalQueue,
  OperationsHealthStrip,
  ServiceHealthCard,
  QuickAccess,
} from "../apps/admin/features/dashboard";
import type {
  DashboardMetric,
  DashboardAttentionItem,
  DashboardQueueItem,
  DashboardPulse,
  DashboardServiceItem,
} from "../apps/admin/features/dashboard/types";

describe("Admin Dashboard — Operations Command Center", () => {
  describe("1. Presentation & Semantics Helpers", () => {
    it("getGreetingForIstHour calculates greeting based on IST hour", () => {
      // 09:00 UTC = 14:30 IST (afternoon)
      const afternoonDate = new Date("2026-10-09T09:00:00Z");
      expect(getGreetingForIstHour(afternoonDate)).toBe("Good afternoon");

      // 03:00 UTC = 08:30 IST (morning)
      const morningDate = new Date("2026-10-09T03:00:00Z");
      expect(getGreetingForIstHour(morningDate)).toBe("Good morning");

      // 15:00 UTC = 20:30 IST (evening)
      const eveningDate = new Date("2026-10-09T15:00:00Z");
      expect(getGreetingForIstHour(eveningDate)).toBe("Good evening");
    });

    it("formatRelativeAge formats relative time and handles edge cases", () => {
      expect(formatRelativeAge(null)).toBe("—");
      expect(formatRelativeAge(undefined)).toBe("—");
      expect(formatRelativeAge("invalid-date")).toBe("—");

      const now = Date.now();
      expect(formatRelativeAge(new Date(now - 10000).toISOString())).toBe("just now");
      expect(formatRelativeAge(new Date(now - 5 * 60000).toISOString())).toBe("5m ago");
      expect(formatRelativeAge(new Date(now - 3 * 3600000).toISOString())).toBe("3h ago");
      expect(formatRelativeAge(new Date(now - 26 * 3600000).toISOString())).toBe("yesterday");
      expect(formatRelativeAge(new Date(now - 3 * 86400000).toISOString())).toBe("3d ago");
    });

    it("formatIstTimestamp appends IST and formats properly", () => {
      expect(formatIstTimestamp(null)).toBe("");
      const formatted = formatIstTimestamp("2026-10-09T12:00:00Z");
      expect(formatted).toContain("IST");
      expect(formatted).toContain("Oct");
    });

    it("formatHumanReference shortens long references and preserves full string", () => {
      const longRef = "VS-ORD-2026-MV0N0M71-3686";
      const { display, full } = formatHumanReference(longRef);
      expect(display).toBe("VS-ORD-…-3686");
      expect(full).toBe(longRef);

      const shortRef = "VS-1024";
      const shortResult = formatHumanReference(shortRef);
      expect(shortResult.display).toBe("VS-1024");
      expect(shortResult.full).toBe("VS-1024");
    });

    it("getStatusSemantic provides consistent status semantics", () => {
      const paid = getStatusSemantic("PAID");
      expect(paid.badgeClass).toContain("status-success");

      const pending = getStatusSemantic("PENDING");
      expect(pending.badgeClass).toContain("status-pending");

      const failed = getStatusSemantic("FAILED");
      expect(failed.badgeClass).toContain("status-danger");

      const draft = getStatusSemantic("DRAFT");
      expect(draft.badgeClass).toContain("status-neutral");
    });

    it("formatCurrencyMinor formats INR minor currency values", () => {
      expect(formatCurrencyMinor(49900, "INR")).toBe("₹499.00");
      expect(formatCurrencyMinor(null)).toBe("—");
    });
  });

  describe("2. Metric Strip Component", () => {
    it("renders dense 5-metric strip and distinguishes 0 from unavailable", () => {
      const metrics: DashboardMetric[] = [
        {
          id: "qr_total",
          label: "QR identities",
          value: 1250,
          detail: "Physical inventory",
          href: "/inventory",
        },
        {
          id: "qr_active",
          label: "Active QR",
          value: 0,
          detail: "0% activated",
          href: "/inventory",
        },
        {
          id: "scans_24h",
          label: "Scans 24h",
          value: null,
          detail: "Temporarily unavailable",
          href: "/analytics",
        },
      ];

      const html = renderToString(React.createElement(MetricStrip, { metrics }));
      expect(html).toContain("QR identities");
      expect(html).toContain("1,250");
      expect(html).toContain("Active QR");
      // Value 0 is rendered as "0", not "—"
      expect(html).toContain(">0<");
      expect(html).toContain("Scans 24h");
      // Value null is rendered as "—"
      expect(html).toContain("—");
      expect(html).toContain('href="/inventory"');
      expect(html).toContain('href="/analytics"');
    });
  });

  describe("3. Needs Attention Panel", () => {
    it("renders clear zero-issue state when no attention items exist", () => {
      const html = renderToString(
        React.createElement(AttentionPanel, { items: [] }),
      );
      expect(html).toContain("NEEDS ATTENTION");
      expect(html).toContain("No urgent operational issues");
      expect(html).toContain("is-clear");
    });

    it("renders prioritized alerts with severity badges and review links", () => {
      const items: DashboardAttentionItem[] = [
        {
          id: "payment_failed",
          title: "Payment failures",
          description: "2 orders require payment review.",
          severity: "critical",
          count: 2,
          actionLabel: "Review →",
          actionHref: "/orders?status=FAILED",
        },
        {
          id: "pending_fulfilment",
          title: "Pending fulfilment",
          description: "1 order awaiting dispatch.",
          severity: "high",
          count: 1,
          actionLabel: "Review →",
          actionHref: "/orders",
        },
      ];

      const html = renderToString(
        React.createElement(AttentionPanel, { items }),
      );
      expect(html).toContain("NEEDS ATTENTION");
      expect(html).toContain("2");
      expect(html).toContain("Payment failures");
      expect(html).toContain("severity-critical");
      expect(html).toContain('href="/orders?status=FAILED"');
    });
  });

  describe("4. Operational Work Queue Component", () => {
    it("renders desktop table and mobile record cards with accessible actions", () => {
      const items: DashboardQueueItem[] = [
        {
          id: "ord-1",
          type: "Payment",
          reference: "VS-ORD-…-3686",
          rawReference: "VS-ORD-2026-MV0N0M71-3686",
          state: "Payment failed",
          context: "Rajesh K.",
          amountFormatted: "₹499.00",
          age: "8m ago",
          timestamp: "09 Oct 2026, 21:00:00 IST",
          actionLabel: "Review →",
          actionHref: "/orders",
        },
      ];

      const html = renderToString(
        React.createElement(OperationalQueue, { items }),
      );
      expect(html).toContain("OPERATIONAL QUEUE");
      expect(html).toContain("VS-ORD-…-3686");
      expect(html).toContain("₹499.00");
      expect(html).toContain("8m ago");
      expect(html).toContain("desktop-only");
      expect(html).toContain("mobile-only");
      expect(html).toContain("queue-mobile-card");
      expect(html).toContain('href="/orders"');
    });
  });

  describe("5. Operations Health Strip & Service Health Card", () => {
    it("renders system health statuses with real latency values", () => {
      const services: DashboardServiceItem[] = [
        {
          name: "Supabase database",
          status: "healthy",
          latencyMs: 38,
          detail: "38 ms",
        },
        {
          name: "Cloudflare R2",
          status: "unavailable",
          detail: "Probe unreachable",
          actionHref: "/gallery",
          actionLabel: "Inspect →",
        },
      ];

      const stripHtml = renderToString(
        React.createElement(OperationsHealthStrip, {
          systemStatus: "degraded",
          services,
          formattedSyncTime: "21:08 IST",
        }),
      );
      expect(stripHtml).toContain("SYSTEM HEALTH");
      expect(stripHtml).toContain("Degraded");
      expect(stripHtml).toContain("38 ms");
      expect(stripHtml).toContain("Cloudflare R2");
      expect(stripHtml).toContain("Unavailable");

      const cardHtml = renderToString(
        React.createElement(ServiceHealthCard, { services }),
      );
      expect(cardHtml).toContain("INFRASTRUCTURE HEALTH");
      expect(cardHtml).toContain("38 ms");
      expect(cardHtml).toContain("Cloudflare R2");
    });
  });

  describe("6. Quick Access Workspaces Panel", () => {
    it("filters workspaces by administrator role", () => {
      // Content editor cannot access inventory or shipping
      const contentHtml = renderToString(
        React.createElement(QuickAccess, { role: "CONTENT_EDITOR" }),
      );
      expect(contentHtml).not.toContain("QR Inventory");
      expect(contentHtml).not.toContain("Shipping");

      // Super admin can access all workspaces
      const superAdminHtml = renderToString(
        React.createElement(QuickAccess, { role: "SUPER_ADMIN" }),
      );
      expect(superAdminHtml).toContain("QR Inventory");
      expect(superAdminHtml).toContain("Batches");
      expect(superAdminHtml).toContain("Shipping");
      expect(superAdminHtml).toContain("Support");
    });
  });

  describe("7. Activity Pulse Visualization", () => {
    it("renders responsive Recharts area visualization when pulse has data", () => {
      const pulse: DashboardPulse = {
        buckets: [
          { hourLabel: "24h ago", scans: 2, activations: 1, orders: 1, failures: 0 },
          { hourLabel: "18h ago", scans: 5, activations: 2, orders: 2, failures: 0 },
          { hourLabel: "12h ago", scans: 12, activations: 4, orders: 3, failures: 1 },
          { hourLabel: "6h ago", scans: 8, activations: 3, orders: 2, failures: 0 },
          { hourLabel: "Now", scans: 15, activations: 5, orders: 4, failures: 0 },
        ],
        totalScans24h: 42,
        totalActivations24h: 15,
        totalOrders24h: 12,
        totalFailures24h: 1,
        hasData: true,
      };

      const html = renderToString(
        React.createElement(ActivityPulse, { pulse }),
      );
      expect(html).toContain("ACTIVITY — LAST 24 HOURS");
      expect(html).toContain("pulse-recharts-container");
      expect(html).toContain("recharts-responsive-container");
      expect(html).toContain("42");
      expect(html).toContain("15");
      expect(html).toContain("12");
      expect(html).toContain("has-failures");
    });

    it("renders professional empty state when pulse has no data", () => {
      const emptyPulse: DashboardPulse = {
        buckets: [],
        totalScans24h: 0,
        totalActivations24h: 0,
        totalOrders24h: 0,
        totalFailures24h: 0,
        hasData: false,
      };

      const html = renderToString(
        React.createElement(ActivityPulse, { pulse: emptyPulse }),
      );
      expect(html).toContain("No recorded events in last 24 hours");
    });
  });
});
