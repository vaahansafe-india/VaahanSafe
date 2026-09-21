import * as React from "react";
import Link from "next/link";
import type { PublicIncidentDto, PublicStatusServiceDto } from "@vaahansafe/status-core";
import { JOURNEY_STAGES } from "@vaahansafe/status-core";

interface ImpactFieldProps {
  incident: PublicIncidentDto;
  services: PublicStatusServiceDto[];
}

export function ImpactField({ incident, services }: ImpactFieldProps) {
  const affectedServices = services.filter((s) =>
    incident.affectedServiceSlugs.includes(s.slug)
  );

  const latestUpdate = incident.updates[0];

  return (
    <section
      aria-label="Active Incident Impact Field"
      className="w-full rounded-2xl border border-[#c64545]/40 bg-[#fdf8f8] p-6 sm:p-8 dark:border-[#c64545]/30 dark:bg-[#201616] transition-colors"
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c64545]/20 pb-4">
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[#c64545] font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#c64545] opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c64545]" />
          </span>
          <span>ACTIVE INCIDENT &bull; {incident.state}</span>
        </div>
        <div className="font-mono text-[9px] uppercase tracking-wider text-[#8e8b82] dark:text-[#77736d]">
          STARTED {incident.startedAtFormatted}
        </div>
      </div>

      {/* Center Structural Journey Breakout */}
      <div className="py-6 space-y-6">
        <div className="space-y-2">
          <h2 className="font-serif text-2xl sm:text-3xl text-[#141413] dark:text-[#faf9f5]">
            {incident.title}
          </h2>
          <p className="font-sans text-sm leading-relaxed text-[#6c6a64] dark:text-[#c2bfb6] max-w-3xl">
            {incident.summary}
          </p>
        </div>

        {/* Affected Journey Node Callout */}
        <div className="rounded-xl border border-[#c64545]/20 bg-white/70 p-5 dark:bg-[#181715]/70 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#e6dfd8] pb-3 dark:border-[#2e2b27]">
            <div className="space-y-0.5">
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#c64545] font-semibold">
                AFFECTED CAPABILITY
              </span>
              <div className="font-serif text-lg text-[#141413] dark:text-[#faf9f5]">
                {affectedServices.map((s) => s.name).join(", ") || "Public Service"}
              </div>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#8e8b82]">
              IMPACT / {incident.impact}
            </div>
          </div>

          {/* Latest Public Progress Note */}
          {latestUpdate && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-[#8e8b82]">
                <span>LATEST UPDATE &bull; {latestUpdate.state}</span>
                <span>{latestUpdate.publishedAtFormatted}</span>
              </div>
              <p className="font-sans text-xs text-[#3d3d3a] dark:text-[#d4d1c9] leading-relaxed">
                {latestUpdate.message}
              </p>
            </div>
          )}
        </div>

        {/* Incident Detail Link */}
        <div className="flex items-center justify-between pt-2 font-mono text-xs uppercase tracking-wider">
          <Link
            href={`/incidents/${incident.slug}`}
            className="text-[#c64545] hover:text-[#992626] font-semibold transition-colors flex items-center gap-1.5"
          >
            <span>View Complete Incident Timeline</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
