"use client";

import { ScanEventRow } from "./ScanEventRow";
import type { ScanEventItem } from "@/lib/scan-history-types";

interface ScanEventGroupProps {
  dateLabel: string;
  events: ScanEventItem[];
  onSelectEvent: (event: ScanEventItem) => void;
}

export function ScanEventGroup({
  dateLabel,
  events,
  onSelectEvent,
}: ScanEventGroupProps) {
  return (
    <div className="space-y-1">
      {/* Editorial Date Separator Header */}
      <div className="flex items-center gap-3 pt-3 pb-1">
        <span className="font-mono text-[11px] font-bold tracking-wider uppercase text-primary">
          {dateLabel}
        </span>
        <span className="h-px flex-1 bg-border/60" />
        <span className="font-mono text-[10px] text-muted-foreground">
          {events.length} {events.length === 1 ? "encounter" : "encounters"}
        </span>
      </div>

      {/* Event Rows */}
      <div className="space-y-0.5">
        {events.map((evt) => (
          <ScanEventRow key={evt.id} event={evt} onSelect={onSelectEvent} />
        ))}
      </div>
    </div>
  );
}
