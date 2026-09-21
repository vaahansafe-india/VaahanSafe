"use client";

import { Badge, Button } from "@vaahansafe/ui";
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
    <div className="group flex items-stretch gap-3 sm:gap-4 py-3 px-2 sm:px-4 rounded-xl hover:bg-muted/40 transition-colors">
      {/* Vertical Rail + Node */}
      <div className="pt-1.5 shrink-0">
        <ScanEventNode isEmergency={isEmergency} />
      </div>

      {/* Main Row Content */}
      <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 min-w-0">
        {/* Left: Time + Identity + Vehicle */}
        <div className="flex items-start sm:items-center gap-3 sm:gap-5 min-w-0">
          {/* Time */}
          <div className="shrink-0 w-12 text-left">
            <span className="font-mono text-xs font-semibold text-foreground">
              {event.occurredAtFormatted}
            </span>
            <div className="text-[10px] font-mono text-muted-foreground hidden sm:block">
              IST
            </div>
          </div>

          {/* QR Identity */}
          <div className="shrink-0">
            <span className="font-mono text-xs font-medium px-2 py-0.5 rounded-md bg-muted/60 border border-border text-foreground">
              {event.publicQrIdentity}
            </span>
          </div>

          {/* Vehicle */}
          <div className="min-w-0 truncate">
            <div className="text-xs sm:text-sm font-semibold text-foreground truncate">
              {event.vehicleDisplay}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground truncate">
              {event.vehiclePlate}
            </div>
          </div>
        </div>

        {/* Right: Outcome + Safe Context + Action */}
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pl-15 sm:pl-0">
          {/* Public View Result Badge */}
          <Badge
            variant={event.resultBadgeVariant}
            className="text-[10px] font-mono font-medium whitespace-nowrap"
          >
            {event.resultLabel}
          </Badge>

          {/* Safe Context (Approximate region & device) */}
          <div className="hidden md:flex flex-col text-right font-mono text-[10px] text-muted-foreground max-w-[140px] truncate">
            <span className="truncate">
              {event.approximateRegion || "Regional network"}
            </span>
            <span>{event.deviceCategory}</span>
          </div>

          {/* View Details Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelect(event)}
            className="h-8 px-2.5 rounded-lg text-xs font-medium gap-1 text-primary hover:text-primary hover:bg-primary/10 transition-colors shadow-none"
          >
            <span>View</span>
            <VaahanIcon name="arrow-right" size={13} />
          </Button>
        </div>
      </div>
    </div>
  );
}
