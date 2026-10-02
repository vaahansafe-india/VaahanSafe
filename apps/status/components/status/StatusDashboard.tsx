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
    overallState: "UNKNOWN",
    headline: "Current service condition could not be confirmed.",
    description: "Status telemetry is temporarily unavailable.",
    generatedAt: new Date().toISOString(),
    generatedAtFormatted: "",
    isStale: true,
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
    <div className="flex min-h-screen flex-col bg-[#faf9f5] text-[#141413] antialiased selection:bg-[#cc785c]/20 selection:text-[#141413] dark:bg-[#181715] dark:text-[#faf9f5]">
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

          <section className="rounded-2xl border border-[#e6dfd8] bg-[#faf9f5] p-5 dark:border-[#2e2b27] dark:bg-[#181715]" aria-label="Supabase database monitor">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-lg">Supabase database</h2>
                <p className="text-xs text-[#6c6a64] dark:text-[#a09d96]">Cloudflare scheduled probe · latest recorded database check</p>
              </div>
              <span className="font-mono text-xs font-semibold" role="status">
                {status.databaseHeartbeat?.status ?? "UNKNOWN"}
              </span>
            </div>
            <p className="mt-3 text-xs text-[#6c6a64] dark:text-[#a09d96]">
              {status.databaseHeartbeat?.checkedAt
                ? `Last successful check: ${new Date(status.databaseHeartbeat.checkedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST`
                : "No successful scheduled check has been recorded yet."}
            </p>
          </section>

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
