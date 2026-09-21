"use client";

import * as React from "react";
import type { PublicSystemStatusDto, PublicStatusServiceDto } from "@vaahansafe/status-core";
import { StatusHeader } from "./shell/StatusHeader";
import { StatusFooter } from "./shell/StatusFooter";
import { CurrentSystemStatement } from "./current/CurrentSystemStatement";
import { SystemPulse } from "./pulse/SystemPulse";
import { ImpactField } from "./incidents/ImpactField";
import { ServiceRegistry } from "./services/ServiceRegistry";
import { ReliabilityField } from "./history/ReliabilityField";
import { IncidentHistory } from "./incidents/IncidentHistory";
import { UpcomingMaintenance } from "./maintenance/UpcomingMaintenance";
import { ReliabilityPrinciple } from "./principle/ReliabilityPrinciple";

interface StatusDashboardProps {
  initialStatus: PublicSystemStatusDto;
}

export function StatusDashboard({ initialStatus }: StatusDashboardProps) {
  const [status, setStatus] = React.useState<PublicSystemStatusDto>(() => initialStatus || {
    overallState: "OPERATIONAL",
    headline: "VaahanSafe services are operating normally.",
    description: "All customer journey capabilities, emergency bystander QR resolvers, and dispatch channels are active and responding within nominal limits.",
    generatedAt: new Date().toISOString(),
    generatedAtFormatted: "",
    isStale: false,
    services: [],
    activeIncidents: [],
    activeMaintenance: [],
    historySummary: { recordedDays: 30, resolvedIncidentCount30D: 0 }
  });
  const [selectedServiceSlug, setSelectedServiceSlug] = React.useState<string | null>(null);

  const activeIncidents = status?.activeIncidents || [];
  const activeIncident = activeIncidents[0] || null;
  const activeMaintenance = status?.activeMaintenance || [];
  const services = status?.services || [];
  const overallState = status?.overallState || "OPERATIONAL";

  const isDegradedOrOutage =
    overallState === "MAJOR OUTAGE" ||
    overallState === "PARTIAL OUTAGE" ||
    overallState === "DEGRADED";

  const handleSelectService = (slug: string) => {
    setSelectedServiceSlug(slug);
    // Smooth scroll to services registry if user clicks on pulse node
    const el = document.getElementById("service-registry-heading");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f5] text-[#141413] antialiased selection:bg-[#cc785c]/20 selection:text-[#141413] dark:bg-[#181715] dark:text-[#faf9f5]">
      {/* 1. Status Header */}
      <StatusHeader
        statusLabel={overallState}
        isDegradedOrOutage={isDegradedOrOutage}
      />

      {/* 2. Main Content Canvas */}
      <main id="main-content" className="flex-1 w-full py-6 sm:py-12">
        <div className="mx-auto max-w-[1240px] px-3 sm:px-6 lg:px-8 space-y-10 sm:space-y-16">
          {/* Top Operational Statement */}
          <CurrentSystemStatement
            overallState={overallState}
            headline={status.headline}
            description={status.description}
            generatedAtFormatted={status.generatedAtFormatted}
          />

          {/* Signature System Pulse Topology */}
          <SystemPulse
            services={services}
            onSelectService={handleSelectService}
            selectedSlug={selectedServiceSlug}
          />

          {/* Signature Impact Field (When active incident exists) */}
          {activeIncident && (
            <ImpactField
              incident={activeIncident}
              services={services}
            />
          )}

          {/* Upcoming Scheduled Maintenance */}
          <UpcomingMaintenance maintenance={activeMaintenance} />

          {/* Service Registry (01-06 Full-Width Capability Matrix) */}
          <ServiceRegistry services={services} />

          {/* Reliability Field (Recorded Day Rails) */}
          <ReliabilityField services={services} />

          {/* Active / Recorded Incidents */}
          <IncidentHistory incidents={status.activeIncidents} />

          {/* Dark Operational Chapter */}
          <ReliabilityPrinciple />
        </div>
      </main>

      {/* 3. Operational Footer */}
      <StatusFooter />
    </div>
  );
}
