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
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 sm:py-5 border-b border-[#e6dfd8] dark:border-[#2e2b27] hover:bg-[#f5f0e8]/50 dark:hover:bg-[#1f1e1b]/50 px-3 -mx-3 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#cc785c]"
    >
      {/* Left: Index + Name & Description */}
      <div className="flex items-start gap-3 sm:gap-5">
        <span className="font-mono text-xs text-[#8e8b82] dark:text-[#77736d] pt-0.5">
          {formattedIndex}
        </span>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-base sm:text-lg text-[#141413] dark:text-[#faf9f5] group-hover:text-[#cc785c] transition-colors">
              {service.name}
            </h3>
            <span className="hidden sm:inline-block font-mono text-[8px] uppercase tracking-wider text-[#8e8b82] border border-[#e6dfd8] px-1.5 py-0.2 rounded dark:border-[#2e2b27]">
              {service.journeyStage}
            </span>
          </div>
          <p className="font-sans text-xs text-[#6c6a64] dark:text-[#a09d96] max-w-xl">
            {service.description}
          </p>
        </div>
      </div>

      {/* Right: Hairline connector + Status Badge */}
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pl-7 sm:pl-0">
        <span className="hidden md:block h-px w-16 bg-[#e6dfd8] dark:bg-[#2e2b27]" />
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: config.dotColor }}
          />
          <span
            className="font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-wider"
            style={{ color: config.textColor }}
          >
            {config.label}
          </span>
        </div>
      </div>
    </div>
  );
}
