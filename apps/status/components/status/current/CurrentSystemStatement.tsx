import * as React from "react";
import type { ServiceState } from "@vaahansafe/status-core";
import { SERVICE_STATE_CONFIG } from "@vaahansafe/status-core";

interface CurrentSystemStatementProps {
  overallState: ServiceState;
  headline: string;
  description: string;
  generatedAtFormatted: string;
}

export function CurrentSystemStatement({
  overallState,
  headline,
  description,
  generatedAtFormatted,
}: CurrentSystemStatementProps) {
  const config = SERVICE_STATE_CONFIG[overallState] || SERVICE_STATE_CONFIG.UNKNOWN;
  const isHealthy = overallState === "OPERATIONAL";

  return (
    <section aria-labelledby="current-condition-heading" className="w-full space-y-6 pt-6 pb-4">
      {/* Eyebrow / Timestamp Record */}
      <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[#8e8b82] dark:text-[#77736d]">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: config.dotColor }}
          />
          <span className="font-semibold text-[#141413] dark:text-[#faf9f5]">
            SYSTEM STATUS &bull; {config.label.toUpperCase()}
          </span>
        </div>
        <div>LAST CONFIRMED {generatedAtFormatted}</div>
      </div>

      {/* Main Headline Statement in Cormorant Garamond Serif */}
      <div className="space-y-3 max-w-4xl">
        <h1
          id="current-condition-heading"
          className="font-serif text-3xl sm:text-5xl lg:text-[3.6rem] font-normal leading-[1.08] tracking-tight text-[#141413] dark:text-[#faf9f5]"
        >
          {headline}
        </h1>
        <p className="max-w-2xl font-sans text-sm sm:text-base leading-relaxed text-[#6c6a64] dark:text-[#a09d96]">
          {description}
        </p>
      </div>

      {/* Signature Restrained System Pulse Mark */}
      <div className="flex items-center gap-3 pt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#8e8b82] dark:text-[#77736d]">
        <div className="flex items-center">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: config.dotColor }}
          />
          <span
            className="h-px w-6 sm:w-10"
            style={{ backgroundColor: isHealthy ? "#5db872" : config.dotColor }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: config.dotColor }}
          />
          <span
            className="h-px w-6 sm:w-10"
            style={{ backgroundColor: isHealthy ? "#5db872" : config.dotColor }}
          />
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: config.dotColor }}
          />
        </div>
        <span className="font-medium text-[#141413] dark:text-[#faf9f5]">
          TOPOLOGY / {config.label.toUpperCase()}
        </span>
      </div>
    </section>
  );
}
