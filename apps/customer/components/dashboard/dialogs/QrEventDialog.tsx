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
import type { DashboardQrLifelineEvent } from "@/lib/dashboard-types";
import { formatFullIstTimestamp } from "@/lib/datetime";

interface QrEventDialogProps {
  event: DashboardQrLifelineEvent | null;
  onOpenChange: (open: boolean) => void;
}

export function QrEventDialog({ event, onOpenChange }: QrEventDialogProps) {
  if (!event) return null;

  return (
    <Dialog open={Boolean(event)} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-md bg-card p-4 sm:p-6 border-border">
        <DialogHeader className="border-b border-border pb-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
            AUDIT TRAIL MILESTONE
          </div>
          <DialogTitle className="font-serif text-xl font-medium text-foreground">
            {event.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Official append-only lifecycle event recorded securely.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="divide-y divide-border rounded-xl border border-border bg-muted/20 text-xs">
            <div className="flex items-center justify-between p-3">
              <span className="text-muted-foreground">Lifecycle State</span>
              <span className="font-mono font-bold text-foreground">{event.status}</span>
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-muted-foreground">Timestamp</span>
              <span className="font-mono text-foreground">
                {formatFullIstTimestamp(event.timestamp)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-muted-foreground">Actor Type</span>
              <span className="font-mono text-foreground">{event.actorType}</span>
            </div>
            {event.reasonCode && (
              <div className="flex items-center justify-between p-3">
                <span className="text-muted-foreground">Reason Code</span>
                <span className="font-mono text-[#cc785c]">{event.reasonCode}</span>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border p-3 text-xs text-muted-foreground">
            <div className="font-mono text-[10px] uppercase text-foreground mb-1">Details</div>
            <p>{event.description}</p>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl bg-[#cc785c] px-4 py-2 font-mono text-xs font-semibold text-white hover:bg-[#a9583e]"
          >
            Close Audit Inspector
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
