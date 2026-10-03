"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { PublicSystemStatusDto, PublicStatusServiceDto } from "@vaahansafe/status-core";
import { StatusHeader } from "./shell/StatusHeader";
import { StatusFooter } from "./shell/StatusFooter";
import { CurrentSystemStatement } from "./current/CurrentSystemStatement";
import { SystemPulse } from "./pulse/SystemPulse";
import { ImpactField } from "./incidents/ImpactField";
import { ServiceRegistry } from "./services/ServiceRegistry";
import { IncidentHistory } from "./incidents/IncidentHistory";
import { UpcomingMaintenance } from "./maintenance/UpcomingMaintenance";
import { ReliabilityPrinciple } from "./principle/ReliabilityPrinciple";
import { InfrastructureMonitor } from "./infrastructure/InfrastructureMonitor";
const HeartbeatCharts = dynamic(
  () => import("./infrastructure/HeartbeatCharts").then((module) => module.HeartbeatCharts),
  {
    ssr: false,
    loading: () => <div className="min-h-[370px] border-t border-[#d8d0c5] py-5 dark:border-[#37342e]"><p className="text-sm text-[#696157] dark:text-[#b2aba0]">Loading recorded heartbeat charts…</p></div>,
  }
);

interface StatusDashboardProps {
  initialStatus: PublicSystemStatusDto;
}

export function StatusDashboard({ initialStatus }: StatusDashboardProps) {
  const [status, setStatus] = React.useState<PublicSystemStatusDto>(() => initialStatus || {
    overallState: "UNKNOWN",
    headline: "Current service condition could not be confirmed.",
    description: "Status telemetry is temporarily unavailable.",
    generatedAt: new Date().toISOString(),
    generatedAtFormatted: "",
    isStale: true,
    services: [],
    serviceHistories: [],
    activeIncidents: [],
    activeMaintenance: [],
    historySummary: { recordedDays: 0, resolvedIncidentCount30D: null }
  });
  const [selectedServiceSlug, setSelectedServiceSlug] = React.useState<string | null>(null);

  React.useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  const activeIncidents = status?.activeIncidents || [];
  const activeIncident = activeIncidents[0] || null;
  const activeMaintenance = status?.activeMaintenance || [];
  const services = status?.services || [];
  const overallState = status?.overallState || "UNKNOWN";

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
    <div className="status-canvas flex min-h-screen flex-col text-[#24221e] antialiased selection:bg-[#cc785c]/20 selection:text-[#141413] dark:text-[#faf9f5]">
      {/* 1. Status Header */}
      <StatusHeader
        statusLabel={overallState}
        isDegradedOrOutage={isDegradedOrOutage}
      />

      {/* 2. Main Content Canvas */}
      <main id="main-content" className="flex-1 w-full max-w-full overflow-x-hidden py-6 sm:py-12">
        <div className="mx-auto max-w-[1240px] w-full min-w-0 px-3 sm:px-6 lg:px-8 space-y-10 sm:space-y-16">
          {/* Top Operational Statement */}
          <CurrentSystemStatement
            overallState={overallState}
            headline={status.headline}
            description={status.description}
            generatedAtFormatted={status.generatedAtFormatted}
          />

          <InfrastructureMonitor heartbeat={status.databaseHeartbeat} />

          <HeartbeatCharts samples={status.databaseHeartbeat?.samples ?? []} generatedAt={status.generatedAt} dataReadable={status.databaseHeartbeat?.databaseStatus === "OPERATIONAL"} />

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
          <ServiceRegistry services={services} histories={status.serviceHistories ?? []} />

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
