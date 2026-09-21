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
  const [status, setStatus] = React.useState<PublicSystemStatusDto>(initialStatus);
  const [selectedServiceSlug, setSelectedServiceSlug] = React.useState<string | null>(null);

  const activeIncident = status.activeIncidents[0] || null;
  const isDegradedOrOutage =
    status.overallState === "MAJOR OUTAGE" ||
    status.overallState === "PARTIAL OUTAGE" ||
    status.overallState === "DEGRADED";

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
        statusLabel={status.overallState}
        isDegradedOrOutage={isDegradedOrOutage}
      />

      {/* 2. Main Content Canvas */}
      <main id="main-content" className="flex-1 w-full py-8 sm:py-12">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
          {/* Top Operational Statement */}
          <CurrentSystemStatement
            overallState={status.overallState}
            headline={status.headline}
            description={status.description}
            generatedAtFormatted={status.generatedAtFormatted}
          />

          {/* Signature System Pulse Topology */}
          <SystemPulse
            services={status.services}
            onSelectService={handleSelectService}
            selectedSlug={selectedServiceSlug}
          />

          {/* Signature Impact Field (When active incident exists) */}
          {activeIncident && (
            <ImpactField
              incident={activeIncident}
              services={status.services}
            />
          )}

          {/* Upcoming Scheduled Maintenance */}
          <UpcomingMaintenance maintenance={status.activeMaintenance} />

          {/* Service Registry (01-06 Full-Width Capability Matrix) */}
          <ServiceRegistry services={status.services} />

          {/* Reliability Field (Recorded Day Rails) */}
          <ReliabilityField services={status.services} />

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
