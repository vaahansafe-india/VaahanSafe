import * as React from "react";
import type { PublicStatusServiceDto } from "@vaahansafe/status-core";
import { SERVICE_STATE_CONFIG } from "@vaahansafe/status-core";

interface ServiceRowProps {
  service: PublicStatusServiceDto;
  index: number;
  onSelect: (service: PublicStatusServiceDto) => void;
}

export function ServiceRow({ service, index, onSelect }: ServiceRowProps) {
  const config = SERVICE_STATE_CONFIG[service.state] || SERVICE_STATE_CONFIG.UNKNOWN;
  const formattedIndex = String(index + 1).padStart(2, "0");

  return (
    <div
      onClick={() => onSelect(service)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(service);
        }
      }}
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6 px-4 sm:px-6 py-4 sm:py-5 hover:bg-[#f5f0e8]/70 dark:hover:bg-[#201f1c]/70 transition-colors cursor-pointer focus-visible:outline-none focus-visible:bg-[#f5f0e8] dark:focus-visible:bg-[#201f1c]"
    >
      {/* Left: Index + Name & Description */}
      <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
        <span className="font-mono text-xs text-[#8e8b82] dark:text-[#77736d] pt-0.5 shrink-0 select-none">
          {formattedIndex}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif text-base sm:text-lg text-[#141413] dark:text-[#faf9f5] group-hover:text-[#cc785c] transition-colors">
              {service.name}
            </h3>
            <span className="inline-flex items-center font-mono text-[8px] uppercase tracking-wider text-[#8e8b82] border border-[#e6dfd8] px-1.5 py-0.5 rounded dark:border-[#2e2b27] shrink-0">
              {service.journeyStage}
            </span>
          </div>
          <p className="font-sans text-xs text-[#6c6a64] dark:text-[#a09d96] leading-relaxed break-words">
            {service.description}
          </p>
        </div>
      </div>

      {/* Right: Live Latency + Status Badge */}
      <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-4 shrink-0 pl-7 sm:pl-0">
        {/* Live Latency Telemetry */}
        {service.latencyMs && (
          <span className="inline-flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] text-[#8e8b82] dark:text-[#77736d] bg-[#f5f0e8] dark:bg-[#1f1e1b] px-2 py-0.5 rounded border border-[#e6dfd8] dark:border-[#2e2b27] shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5db872]" />
            <span>{service.latencyMs}ms</span>
          </span>
        )}

        <div className="inline-flex items-center gap-2 shrink-0 bg-[#f5f0e8]/80 dark:bg-[#1f1e1b]/80 sm:bg-transparent sm:dark:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg sm:rounded-none border border-[#e6dfd8] dark:border-[#2e2b27] sm:border-0">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: config.dotColor }}
          />
          <span
            className="font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
            style={{ color: config.textColor }}
          >
            {config.label}
          </span>
        </div>
      </div>
    </div>
  );
}
