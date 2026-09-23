"use client";

import { useState } from "react";
import { ScanEventRow } from "./ScanEventRow";
import { VaahanIcon } from "@vaahansafe/icons";
import { ChevronDown } from "lucide-react";
import type { ScanEventItem } from "@/lib/scan-history-types";

interface ScanEventGroupProps {
  dateLabel: string;
  events: ScanEventItem[];
  defaultOpen?: boolean;
  onSelectEvent: (event: ScanEventItem) => void;
}

export function ScanEventGroup({
  dateLabel,
  events,
  defaultOpen = true,
  onSelectEvent,
}: ScanEventGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const isToday = dateLabel.toUpperCase() === "TODAY";
  const isYesterday = dateLabel.toUpperCase() === "YESTERDAY";
  const emergencyCount = events.filter((e) => e.scanType === "EMERGENCY_TRIGGER").length;

  return (
    <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm overflow-hidden transition-all duration-200 shadow-xs">
      {/* Accordion Header / Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between p-3.5 sm:p-4 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer select-none text-left ${
          isOpen ? "border-b border-border/40" : ""
        }`}
      >
        {/* Left: Date Category & Pulse Pill */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${
                isToday
                  ? "bg-emerald-500 animate-pulse"
                  : isYesterday
                  ? "bg-[#cc785c]"
                  : "bg-muted-foreground/60"
              }`}
              aria-hidden="true"
            />
            <span className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-foreground">
              {dateLabel}
            </span>
          </div>

          {isToday && (
            <span className="hidden xs:inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              CURRENT
            </span>
          )}
          {isYesterday && (
            <span className="hidden xs:inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-mono text-[9px] font-semibold text-muted-foreground border border-border">
              PAST 24H
            </span>
          )}
        </div>

        {/* Right: Encounter Count, Emergency Indicator & Chevron */}
        <div className="flex items-center gap-3 shrink-0">
          {emergencyCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#c64545]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#c64545] border border-[#c64545]/20">
              <VaahanIcon name="alert" size={11} aria-hidden="true" />
              <span>{emergencyCount} Emergency</span>
            </span>
          )}

          <span className="font-mono text-[10.5px] sm:text-xs text-muted-foreground font-medium">
            {events.length} {events.length === 1 ? "encounter" : "encounters"}
          </span>

          <div
            className={`flex size-6 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          >
            <ChevronDown className="size-3.5" />
          </div>
        </div>
      </button>

      {/* Accordion Body: Event Rows */}
      {isOpen && (
        <div className="flex flex-col gap-2.5 sm:gap-2 p-2.5 sm:p-3 bg-muted/5">
          {events.map((evt) => (
            <ScanEventRow key={evt.id} event={evt} onSelect={onSelectEvent} />
          ))}
        </div>
      )}
    </div>
  );
}
