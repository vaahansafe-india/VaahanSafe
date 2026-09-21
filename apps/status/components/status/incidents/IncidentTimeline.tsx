import * as React from "react";
import type { PublicIncidentUpdateDto } from "@vaahansafe/status-core";

interface IncidentTimelineProps {
  updates: PublicIncidentUpdateDto[];
}

export function IncidentTimeline({ updates }: IncidentTimelineProps) {
  if (updates.length === 0) {
    return (
      <div className="font-sans text-xs text-[#8e8b82] py-4">
        No formal updates recorded for this incident.
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4" aria-label="Chronological incident updates">
      {updates.map((update, idx) => {
        const isLast = idx === updates.length - 1;
        const isResolved = update.state === "RESOLVED";

        return (
          <div key={idx} className="flex items-start gap-4">
            {/* Timeline Spine */}
            <div className="relative flex flex-col items-center pt-1">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isResolved ? "bg-[#5db872]" : "bg-[#c64545]"
                }`}
              />
              {!isLast && (
                <span className="h-16 w-px my-1.5 bg-[#e6dfd8] dark:bg-[#2e2b27]" />
              )}
            </div>

            {/* Update Content */}
            <div className="flex-1 space-y-1 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-wider text-[#8e8b82]">
                <span className="font-semibold text-[#141413] dark:text-[#faf9f5]">
                  {update.state}
                </span>
                <span>{update.publishedAtFormatted}</span>
              </div>
              <p className="font-sans text-xs sm:text-sm text-[#3d3d3a] dark:text-[#c2bfb6] leading-relaxed">
                {update.message}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
