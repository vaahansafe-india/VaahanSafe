"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@vaahansafe/ui";
import type { DashboardConstellationEvent } from "@/lib/dashboard-types";

interface ConstellationEventDialogProps {
  event: DashboardConstellationEvent | null;
  onOpenChange: (open: boolean) => void;
}

export function ConstellationEventDialog({
  event,
  onOpenChange,
}: ConstellationEventDialogProps) {
  if (!event) return null;

  return (
    <Dialog open={Boolean(event)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card p-6 border-border">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
              ACTIVITY CONSTELLATION INCIDENT
            </span>
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] font-bold text-foreground">
              {event.lane}
            </span>
          </div>
          <DialogTitle className="font-serif text-xl font-medium text-foreground">
            {event.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Authoritative telemetry and incident log record.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4 text-xs">
          <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Recorded Timestamp</span>
              <span className="font-mono text-foreground">
                {event.timestamp ? event.timestamp.replace("T", " ") : "Recorded"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Event Severity</span>
              <span
                className={`font-mono font-bold ${
                  event.level === "EMERGENCY"
                    ? "text-[#c64545]"
                    : event.level === "ATTENTION"
                    ? "text-[#e8a55a]"
                    : "text-[#5db8a6]"
                }`}
              >
                {event.level || "NORMAL"}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border p-3 text-muted-foreground">
            <div className="font-mono text-[10px] uppercase text-foreground mb-1">
              Event Summary
            </div>
            <p className="text-foreground">{event.summary}</p>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl bg-[#cc785c] px-4 py-2 font-mono text-xs font-semibold text-white hover:bg-[#a9583e]"
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
