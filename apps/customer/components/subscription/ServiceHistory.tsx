"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui";
import type { ServiceHistoryTimelineEvent } from "@/lib/subscription-types";

interface ServiceHistoryProps {
  events: ServiceHistoryTimelineEvent[];
  onSelectEvent: (event: ServiceHistoryTimelineEvent) => void;
}

export function ServiceHistory({ events, onSelectEvent }: ServiceHistoryProps) {
  const formatDate = (isoString: string) => {
    try {
      return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  const displayedEvents = events.slice(0, 6);

  return (
    <section 
      aria-label="Service History" 
      className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-2xs"
    >
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c] font-semibold">
              Audit & Lifecycle Log
            </span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="font-mono text-xs text-muted-foreground">
              {events.length} Historical Record{events.length !== 1 ? "s" : ""}
            </span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-foreground">
            Service History
          </h3>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground font-mono">
          No service lifecycle events logged yet.
        </div>
      ) : (
        <div className="space-y-2 pt-1">
          {displayedEvents.map((evt, idx) => (
            <div
              key={evt.id}
              onClick={() => onSelectEvent(evt)}
              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl border border-border/80 bg-background hover:bg-muted/40 hover:border-border transition-all cursor-pointer active:scale-[0.99]"
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground group-hover:text-[#cc785c] transition-colors">
                  <span className="font-mono text-[11px] font-bold">0{idx + 1}</span>
                </div>

                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="font-mono text-xs font-bold text-foreground group-hover:text-[#cc785c] transition-colors">
                      {evt.title}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {formatDate(evt.timestamp)}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1">
                    {evt.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                <Badge
                  variant="outline"
                  className={`font-mono text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 ${
                    evt.severity === "SUCCESS"
                      ? "border-[#5db8a6]/40 bg-[#5db8a6]/10 text-[#5db8a6] hover:bg-[#5db8a6]/15 hover:text-[#5db8a6]"
                      : evt.severity === "AMBER"
                      ? "border-[#e8a55a]/40 bg-[#e8a55a]/10 text-[#e8a55a] hover:bg-[#e8a55a]/15 hover:text-[#e8a55a]"
                      : "border-border bg-muted text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {evt.badgeLabel}
                </Badge>
                <VaahanIcon name="chevron-right" size={13} className="text-muted-foreground shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
