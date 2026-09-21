"use client";

import { useState, useMemo } from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { PaymentChartTooltip } from "./PaymentChartTooltip";
import { PaymentChartEmpty } from "./PaymentChartEmpty";
import type { PaymentPulseEvent } from "@/lib/payments-types";

interface PaymentPulseProps {
  events: PaymentPulseEvent[];
}

export function PaymentPulse({ events }: PaymentPulseProps) {
  const [period, setPeriod] = useState<"30D" | "90D" | "6M" | "1Y" | "ALL">("ALL");
  const [hoveredEvent, setHoveredEvent] = useState<PaymentPulseEvent | null>(null);

  // Filter events by period
  const filteredEvents = useMemo(() => {
    if (period === "ALL") return events;

    const now = Date.now();
    const daysMap = {
      "30D": 30,
      "90D": 90,
      "6M": 180,
      "1Y": 365,
    };

    const maxDays = daysMap[period];
    const cutoff = now - maxDays * 24 * 60 * 60 * 1000;

    return events.filter((e) => new Date(e.date).getTime() >= cutoff);
  }, [events, period]);

  // If no confirmed payments exist at all
  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
              Payment Pulse
            </div>
            <h3 className="font-serif text-lg font-medium text-foreground">
              Financial Activity
            </h3>
          </div>
        </div>
        <PaymentChartEmpty />
      </div>
    );
  }

  // Intelligently replace chart with an elegant activity rail if 1 or 2 events
  const isSparse = filteredEvents.length <= 2;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5">
      {/* Header & Period Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-4">
        <div className="space-y-0.5">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
            Payment Pulse
          </div>
          <h3 className="font-serif text-lg font-medium text-foreground">
            Confirmed Payment Activity
          </h3>
        </div>

        {events.length > 2 && (
          <div className="flex items-center rounded-lg border border-border bg-background p-1 text-[11px] font-mono">
            {(["30D", "90D", "6M", "1Y", "ALL"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  period === p
                    ? "bg-[#cc785c] text-white font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredEvents.length === 0 ? (
        <PaymentChartEmpty message="NO ACTIVITY IN THIS PERIOD" subtext="Select 'ALL' to view confirmed transactions." />
      ) : isSparse ? (
        /* Refined Milestone Activity Rail for 1-2 events */
        <div className="py-2 space-y-4">
          <p className="text-xs text-muted-foreground">
            Authoritative financial milestone recorded on the VaahanSafe ledger:
          </p>

          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-[11px] sm:before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-[#5db8a6] before:to-[#cc785c]/40">
            {filteredEvents.map((evt) => {
              const dateStr = new Intl.DateTimeFormat("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(new Date(evt.date));

              return (
                <div key={evt.id} className="relative group">
                  {/* Milestone Node */}
                  <div className="absolute -left-6 sm:-left-8 top-1 flex size-6 sm:size-7 items-center justify-center rounded-full border border-[#5db8a6]/40 bg-card text-[#5db8a6] shadow-xs">
                    <span className="size-2 rounded-full bg-[#5db8a6] animate-pulse" />
                  </div>

                  <div className="rounded-xl border border-border bg-background p-4 space-y-2 hover:border-[#cc785c]/40 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base sm:text-lg font-bold text-foreground">
                          ₹{(evt.amountMinor / 100).toLocaleString("en-IN")}
                        </span>
                        <span className="rounded bg-[#5db8a6]/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#5db8a6]">
                          {evt.status}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">
                        {dateStr}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/60">
                      <span>{evt.purposeLabel}</span>
                      <span className="font-mono font-medium text-foreground">
                        Order: {evt.orderNumber}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Full interactive temporal financial rail */
        <div className="relative pt-4 pb-2 space-y-4">
          <div className="relative h-24 w-full flex items-center justify-between border-b border-border/80 px-2 sm:px-6">
            {/* Horizontal timeline rail */}
            <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-border via-[#cc785c]/60 to-[#5db8a6]/60" />

            {filteredEvents.map((evt, idx) => {
              const isHovered = hoveredEvent?.id === evt.id;
              const dateStr = new Intl.DateTimeFormat("en-IN", {
                day: "numeric",
                month: "short",
              }).format(new Date(evt.date));

              return (
                <div
                  key={evt.id}
                  className="relative flex flex-col items-center cursor-pointer group"
                  onMouseEnter={() => setHoveredEvent(evt)}
                  onMouseLeave={() => setHoveredEvent(null)}
                  onClick={() => setHoveredEvent(isHovered ? null : evt)}
                >
                  {/* Event Marker Node */}
                  <div
                    className={`size-4 sm:size-5 rounded-full border-2 transition-all ${
                      isHovered
                        ? "border-[#cc785c] bg-[#cc785c] scale-125 shadow-md"
                        : "border-[#5db8a6] bg-background hover:scale-110"
                    }`}
                  >
                    <div className="size-full rounded-full bg-[#5db8a6]/20" />
                  </div>

                  {/* Vertical registration tick */}
                  <div className="h-2 w-[1px] bg-border my-1" />

                  {/* Date label */}
                  <span className="font-mono text-[10px] text-muted-foreground group-hover:text-foreground">
                    {dateStr}
                  </span>

                  {/* Floating Tooltip */}
                  {isHovered && (
                    <div className="absolute bottom-12 z-20 whitespace-nowrap">
                      <PaymentChartTooltip event={evt} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-muted-foreground text-center sm:text-left">
            Hover or tap temporal registration nodes to inspect individual verified payment sessions.
          </p>
        </div>
      )}
    </div>
  );
}
