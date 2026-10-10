import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SystemPulse } from "../apps/status/components/status/pulse/SystemPulse";
import type { PublicStatusServiceDto } from "@vaahansafe/status-core";

describe("Core journey with auxiliary analytics monitoring", () => {
  it("keeps customer app state and label when analytics shares the account stage", () => {
    const services: PublicStatusServiceDto[] = [
      { publicId: "vs_srv_customer_app", slug: "customer-app", name: "Customer App", description: "Account", journeyStage: "ACCOUNT", state: "DEGRADED", displayOrder: 2 },
      { publicId: "vs_srv_customer_analytics", slug: "customer-analytics", name: "Customer Analytics", description: "Reporting", journeyStage: "ACCOUNT", state: "OPERATIONAL", displayOrder: 7 },
    ];
    const markup = renderToStaticMarkup(createElement(SystemPulse, { services }));
    expect(markup).toContain("Customer App");
    expect(markup).toContain("Degraded");
    expect(markup).not.toContain("Customer Analytics");
  });
});
