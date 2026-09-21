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
      className="group flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 py-4 sm:py-5 hover:bg-[#f5f0e8]/50 dark:hover:bg-[#1f1e1b]/50 px-2 sm:px-3 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#cc785c]"
    >
      {/* Left: Index + Name & Description */}
      <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
        <span className="font-mono text-xs text-[#8e8b82] dark:text-[#77736d] pt-0.5 shrink-0">
          {formattedIndex}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif text-base sm:text-lg text-[#141413] dark:text-[#faf9f5] group-hover:text-[#cc785c] transition-colors truncate">
              {service.name}
            </h3>
            <span className="inline-flex items-center font-mono text-[8px] uppercase tracking-wider text-[#8e8b82] border border-[#e6dfd8] px-1.5 py-0.5 rounded dark:border-[#2e2b27] shrink-0">
              {service.journeyStage}
            </span>
          </div>
          <p className="font-sans text-xs text-[#6c6a64] dark:text-[#a09d96] leading-relaxed line-clamp-2 md:line-clamp-none break-words max-w-2xl">
            {service.description}
          </p>
        </div>
      </div>

      {/* Right: Live Latency + Status Badge */}
      <div className="flex items-center justify-between md:justify-end gap-2.5 sm:gap-4 shrink-0 pl-7 md:pl-0">
        {/* Hairline connector on large desktop only */}
        <span className="hidden xl:block h-px w-10 lg:w-14 bg-[#e6dfd8] dark:bg-[#2e2b27] shrink-0" />

        {/* Live Latency Telemetry */}
        {service.latencyMs && (
          <span className="inline-flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] text-[#8e8b82] dark:text-[#77736d] bg-[#faf9f5] dark:bg-[#181715] px-2 py-0.5 rounded border border-[#e6dfd8] dark:border-[#2e2b27] shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5db872]" />
            <span>{service.latencyMs}ms</span>
          </span>
        )}

        <div className="flex items-center gap-2 shrink-0 bg-[#faf9f5]/80 dark:bg-[#181715]/80 md:bg-transparent md:dark:bg-transparent px-2.5 py-1 md:p-0 rounded-lg md:rounded-none border border-[#e6dfd8] dark:border-[#2e2b27] md:border-0">
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
