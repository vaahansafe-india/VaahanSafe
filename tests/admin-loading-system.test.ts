import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  AdminLoadingBlock,
  AdminMetricSkeleton,
  AdminChartSkeleton,
  AdminTableSkeleton,
  AdminDashboardSkeleton,
  AdminDetailSkeleton,
  AdminPageSkeleton,
  useAdminRouteProgress,
} from "../apps/admin/components/loading";

describe("Admin Loading & Route Transition System", () => {
  it("AdminLoadingBlock renders geometric placeholder with aria-hidden", () => {
    const html = renderToString(
      React.createElement(AdminLoadingBlock, {
        width: "120px",
        height: "16px",
        borderRadius: "4px",
      })
    );
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("admin-loading-block");
    expect(html).toContain("width:120px");
    expect(html).toContain("height:16px");
    expect(html).toContain("border-radius:4px");
  });

  it("AdminTableSkeleton conforms to 5-8 row rule and has accessible semantics", () => {
    const html = renderToString(
      React.createElement(AdminTableSkeleton, { title: "Batches", rowCount: 6 })
    );
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-label="Loading Batches records"');
    expect(html).toContain("<table");
    expect(html).toContain("<thead>");
    expect(html).toContain("<tbody>");
    // Verify 6 rows are rendered (within 5-8 limit)
    const rowMatches = html.match(/<tr/g);
    // 1 header tr + 6 body tr = 7 tr tags
    expect(rowMatches?.length).toBe(7);
  });

  it("AdminDashboardSkeleton preserves dashboard geometry with hero, metrics and split grid", () => {
    const html = renderToString(React.createElement(AdminDashboardSkeleton));
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("admin-hero");
    expect(html).toContain("admin-metrics");
    expect(html).toContain("admin-grid");
  });

  it("AdminDetailSkeleton renders back button placeholder, attribute grid and timeline", () => {
    const html = renderToString(
      React.createElement(AdminDetailSkeleton, { title: "Batch #B-102" })
    );
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-label="Loading Batch #B-102 details"');
    expect(html).toContain("admin-grid");
  });

  it("AdminMetricSkeleton renders metric card placeholders with muted geometry", () => {
    const html = renderToString(
      React.createElement(AdminMetricSkeleton, { count: 4 })
    );
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("admin-metrics");
    const metricCards = html.match(/class="admin-metric"/g);
    expect(metricCards?.length).toBe(4);
  });

  it("AdminChartSkeleton renders title and proportional data bars", () => {
    const html = renderToString(
      React.createElement(AdminChartSkeleton, { height: 200 })
    );
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("admin-panel");
  });

  it("AdminPageSkeleton renders general fallback structure with aria-busy", () => {
    const html = renderToString(
      React.createElement(AdminPageSkeleton, { title: "System Settings" })
    );
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("admin-page-skeleton");
  });

  it("useAdminRouteProgress provides safe defaults when rendered outside provider", () => {
    let capturedContext: ReturnType<typeof useAdminRouteProgress> | null = null;
    function Consumer() {
      capturedContext = useAdminRouteProgress();
      return React.createElement("div", null, "consumer");
    }
    renderToString(React.createElement(Consumer));
    expect(capturedContext).not.toBeNull();
    expect(capturedContext!.isNavigating).toBe(false);
    expect(capturedContext!.pendingPathname).toBeNull();
    expect(typeof capturedContext!.startNavigation).toBe("function");
    expect(typeof capturedContext!.completeNavigation).toBe("function");
  });
});
