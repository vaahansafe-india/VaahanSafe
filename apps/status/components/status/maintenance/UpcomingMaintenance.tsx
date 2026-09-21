import * as React from "react";
import type { PublicMaintenanceDto } from "@vaahansafe/status-core";

interface UpcomingMaintenanceProps {
  maintenance: PublicMaintenanceDto[];
}

export function UpcomingMaintenance({ maintenance }: UpcomingMaintenanceProps) {
  if (maintenance.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="maintenance-heading" className="w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6dfd8] pb-4 dark:border-[#2e2b27]">
        <h2
          id="maintenance-heading"
          className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#5db8a6] font-semibold flex items-center gap-2"
        >
          <span className="h-2 w-2 rounded-full bg-[#5db8a6]" />
          <span>SCHEDULED MAINTENANCE / UPCOMING WINDOW</span>
        </h2>
      </div>

      <div className="space-y-4">
        {maintenance.map((m) => (
          <div
            key={m.publicId}
            className="rounded-xl border border-[#5db8a6]/40 bg-[#5db8a6]/5 p-5 space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h3 className="font-serif text-lg text-[#141413] dark:text-[#faf9f5]">
                {m.title}
              </h3>
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#2b7c6e] font-semibold">
                {m.state}
              </span>
            </div>
            <p className="font-sans text-xs text-[#6c6a64] dark:text-[#a09d96]">
              {m.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 font-mono text-[9px] uppercase tracking-wider text-[#8e8b82]">
              <span>WINDOW: {m.scheduledStartFormatted} &mdash; {m.scheduledEndFormatted}</span>
              {m.affectedServiceSlugs.length > 0 && (
                <>
                  <span>&bull;</span>
                  <span>AFFECTED: {m.affectedServiceSlugs.join(", ")}</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
