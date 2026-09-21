"use client";

import * as React from "react";
import type { VehicleHistoryMilestone } from "@/lib/vehicle-types";

interface VehicleHistoryProps {
  history: VehicleHistoryMilestone[];
}

export function VehicleHistory({ history }: VehicleHistoryProps) {
  if (history.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
            AUDIT TRAIL
          </div>
          <h3 className="font-serif text-lg font-medium text-foreground">
            Identity Lifecycle Milestones
          </h3>
        </div>
        <div className="font-mono text-[10px] text-muted-foreground">
          VERIFIED AUDIT LOG
        </div>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
        {history.map((item) => (
          <div key={item.id} className="relative">
            <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-[#cc785c] bg-card" />
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <span className="font-mono text-xs font-bold text-foreground">
                {item.title}
              </span>
              <span className="font-mono text-[10.5px] text-muted-foreground">
                {new Date(item.timestamp).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
