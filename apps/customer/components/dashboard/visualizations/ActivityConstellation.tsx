"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type { DashboardConstellationEvent, ConstellationLane } from "@/lib/dashboard-types";

interface ActivityConstellationProps {
  events: DashboardConstellationEvent[];
  onSelectEvent: (event: DashboardConstellationEvent) => void;
}

export function ActivityConstellation({
  events,
  onSelectEvent,
}: ActivityConstellationProps) {
  const lanes: Array<{ id: ConstellationLane; label: string; icon: "activity" | "qr" | "vehicle" | "shield" | "cart" | "bell" }> = [
    { id: "SCAN", label: "SCAN", icon: "activity" },
    { id: "QR", label: "QR IDENTITY", icon: "qr" },
    { id: "VEHICLE", label: "VEHICLE", icon: "vehicle" },
    { id: "SAFETY", label: "SAFETY VIEW", icon: "shield" },
    { id: "ORDER", label: "COMMERCE", icon: "cart" },
    { id: "NOTIF", label: "NOTIFICATIONS", icon: "bell" },
  ];

  // Group events by lane for 2D temporal surface
  const eventsByLane = React.useMemo(() => {
    const map = new Map<ConstellationLane, DashboardConstellationEvent[]>();
    for (const lane of lanes) {
      map.set(lane.id, []);
    }
    for (const evt of events) {
      const existing = map.get(evt.lane);
      if (existing) {
        existing.push(evt);
      }
    }
    return map;
  }, [events]);

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="border-b border-border pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#cc785c]" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-foreground">
              ACTIVITY CONSTELLATION &bull; MULTI-LANE EVENT FIELD
            </h3>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            {events.length} RECORDED INCIDENT{events.length === 1 ? "" : "S"}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Synchronized temporal map of vehicle events across scans, hardware lifecycle, privacy updates, and orders.
        </p>
      </div>

      {/* Desktop & Tablet: Multi-Lane 2D Constellation Grid */}
      <div className="mt-6 hidden md:block space-y-3">
        {lanes.map((lane) => {
          const laneEvents = eventsByLane.get(lane.id) || [];
          return (
            <div
              key={lane.id}
              className="flex items-center gap-4 rounded-xl border border-border/40 bg-muted/20 p-2.5"
            >
              {/* Lane Title & Icon */}
              <div className="flex w-36 shrink-0 items-center gap-2 border-r border-border/60 pr-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-[#cc785c]">
                  <VaahanIcon name={lane.icon} size={13} />
                </span>
                <span className="font-mono text-[10px] font-bold text-foreground">
                  {lane.label}
                </span>
              </div>

              {/* Lane Horizontal Rail with Event Nodes */}
              <div className="relative flex min-h-[32px] flex-1 items-center overflow-x-auto">
                {/* Horizontal Guide Rail */}
                <div className="absolute left-0 right-0 h-px bg-border/80" />

                {laneEvents.length === 0 ? (
                  <span className="relative z-10 font-mono text-[10px] text-muted-foreground/60 italic pl-2">
                    No recent events on this lane
                  </span>
                ) : (
                  <div className="relative z-10 flex items-center gap-4 pl-2">
                    {laneEvents.map((evt) => {
                      const isEmergency = evt.level === "EMERGENCY";
                      const isAttention = evt.level === "ATTENTION";
                      const dotColor = isEmergency
                        ? "bg-[#c64545] ring-2 ring-[#c64545]/30"
                        : isAttention
                        ? "bg-[#e8a55a] ring-2 ring-[#e8a55a]/30"
                        : "bg-[#cc785c] hover:bg-[#5db8a6]";

                      return (
                        <button
                          key={evt.id}
                          type="button"
                          onClick={() => onSelectEvent(evt)}
                          className="group relative flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 shadow-2xs transition-all hover:scale-105 hover:border-[#cc785c] focus:outline-none"
                          title={`${evt.title} — ${evt.summary}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                          <span className="font-mono text-[10px] font-medium text-foreground truncate max-w-[140px]">
                            {evt.title}
                          </span>
                          <span className="font-mono text-[8px] text-muted-foreground">
                            {evt.timestamp ? evt.timestamp.slice(5, 10) : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Alternative: Chronological Identity Feed */}
      <div className="mt-4 divide-y divide-border md:hidden">
        {events.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No activity events recorded yet.
          </div>
        ) : (
          events.slice(0, 8).map((evt) => (
            <div
              key={evt.id}
              onClick={() => onSelectEvent(evt)}
              className="flex items-start gap-3 py-2.5 cursor-pointer"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[#cc785c]">
                <VaahanIcon name="activity" size={13} />
              </span>
              <div className="flex-1">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="font-mono text-xs font-bold text-foreground">
                    {evt.title}
                  </span>
                  <span className="font-mono text-[9px] text-muted-foreground">
                    {evt.timestamp ? evt.timestamp.slice(5, 16).replace("T", " ") : ""}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {evt.summary}
                </div>
                <span className="inline-block mt-0.5 font-mono text-[8px] uppercase tracking-wider text-[#cc785c]">
                  LANE: {evt.lane}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 border-t border-border pt-3 text-[10px] font-mono text-muted-foreground">
        CLICK ANY EVENT NODE FOR AUTHORITATIVE PAYLOAD & TIMESTAMPS
      </div>
    </div>
  );
}
