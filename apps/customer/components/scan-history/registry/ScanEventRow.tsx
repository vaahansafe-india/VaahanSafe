"use client";

import { Badge } from "@vaahansafe/ui";
import { VaahanIcon } from "@vaahansafe/icons";
import { ScanEventNode } from "./ScanEventNode";
import type { ScanEventItem } from "@/lib/scan-history-types";

interface ScanEventRowProps {
  event: ScanEventItem;
  onSelect: (event: ScanEventItem) => void;
}

export function ScanEventRow({ event, onSelect }: ScanEventRowProps) {
  const isEmergency = event.scanType === "EMERGENCY_TRIGGER";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(event)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(event);
        }
      }}
      className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:px-4 sm:py-3.5 rounded-xl border border-border/40 sm:border-transparent hover:border-border/80 hover:bg-muted/40 transition-all duration-150 cursor-pointer select-none bg-card/50 sm:bg-transparent"
    >
      {/* Desktop Node Indicator (Left Rail) */}
      <div className="hidden sm:flex items-center shrink-0">
        <ScanEventNode isEmergency={isEmergency} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 min-w-0">
        {/* Mobile Top Row / Desktop Left Block */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-4 min-w-0">
          {/* Time Badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="sm:hidden">
              <ScanEventNode isEmergency={isEmergency} />
            </span>
            <div className="font-mono text-xs font-bold text-foreground">
              {event.occurredAtFormatted}
              <span className="ml-1 text-[10px] text-muted-foreground font-normal">
                IST
              </span>
            </div>
          </div>

          {/* Pass ID Pill */}
          <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md bg-muted/80 border border-border/80 text-foreground shrink-0">
            {event.publicQrIdentity}
          </span>

          {/* Vehicle Plate & Model (Desktop) */}
          <div className="hidden md:block min-w-0 truncate">
            <div className="text-xs font-semibold text-foreground truncate">
              {event.vehicleDisplay}
            </div>
            <div className="font-mono text-[10.5px] text-muted-foreground truncate">
              {event.vehiclePlate}
            </div>
          </div>
        </div>

        {/* Mobile Mid Row: Vehicle info */}
        <div className="md:hidden flex items-baseline justify-between gap-2 border-t border-border/30 pt-2 sm:border-0 sm:pt-0">
          <span className="text-xs font-semibold text-foreground truncate">
            {event.vehicleDisplay}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground shrink-0">
            {event.vehiclePlate}
          </span>
        </div>

        {/* Outcome, Location & CTA */}
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 border-t border-border/30 pt-2 sm:border-0 sm:pt-0">
          {/* Result Badge */}
          <Badge
            variant={event.resultBadgeVariant}
            className="text-[10px] font-mono font-medium whitespace-nowrap uppercase tracking-wider"
          >
            {event.resultLabel}
          </Badge>

          {/* Location & Device Family */}
          <div className="flex flex-col text-right font-mono text-[10px] text-muted-foreground max-w-[140px] truncate">
            <span className="truncate text-foreground/80 font-medium">
              {event.approximateRegion || "Regional network"}
            </span>
            <span className="text-[9.5px] text-muted-foreground truncate">
              {event.deviceCategory}
            </span>
          </div>

          {/* Action Trigger */}
          <div className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-primary group-hover:translate-x-0.5 transition-transform shrink-0">
            <span>View</span>
            <VaahanIcon name="arrow-right" size={12} aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}
