import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { StatusRepository } from "@vaahansafe/status-core";
import { StatusHeader } from "../../components/status/shell/StatusHeader";
import { StatusFooter } from "../../components/status/shell/StatusFooter";
import { ReliabilityField } from "../../components/status/history/ReliabilityField";
import { IncidentHistory } from "../../components/status/incidents/IncidentHistory";

export const metadata: Metadata = {
  title: "Reliability & Incident History — VaahanSafe Status",
  description: "Historical reliability records, resolved incident archives, and uptime logs for VaahanSafe.",
  alternates: {
    canonical: "https://status.vaahansafe.com/history",
  },
};

export default async function HistoryPage() {
  const repo = new StatusRepository();
  const [services, incidents] = await Promise.all([
    repo.getPublicServices(),
    repo.getIncidentHistory(50),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f5] text-[#141413] antialiased selection:bg-[#cc785c]/20 selection:text-[#141413] dark:bg-[#181715] dark:text-[#faf9f5]">
      <StatusHeader />

      <main id="main-content" className="flex-1 w-full py-12 sm:py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="space-y-4 border-b border-[#e6dfd8] pb-8 dark:border-[#2e2b27] max-w-3xl">
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[#cc785c] font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
              <span>HISTORICAL LOGS</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#141413] dark:text-[#faf9f5]">
              System Reliability Archive
            </h1>
            <p className="font-sans text-sm sm:text-base leading-relaxed text-[#6c6a64] dark:text-[#a09d96]">
              A complete, unvarnished history of past incidents, resolutions, and daily capability availability records across India.
            </p>
          </div>

          {/* Temporal Rails */}
          <ReliabilityField services={services} />

          {/* Past Incidents Archive */}
          <div className="pt-6 border-t border-[#e6dfd8] dark:border-[#2e2b27]">
            <IncidentHistory incidents={incidents} />
          </div>

          <div className="pt-6 border-t border-[#e6dfd8] dark:border-[#2e2b27]">
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-full bg-[#141413] px-6 font-sans text-xs font-medium text-[#faf9f5] hover:bg-[#3d3d3a] dark:bg-[#faf9f5] dark:text-[#141413] transition-colors"
            >
              &larr; Back to System Pulse
            </Link>
          </div>
        </div>
      </main>

      <StatusFooter />
    </div>
  );
}
