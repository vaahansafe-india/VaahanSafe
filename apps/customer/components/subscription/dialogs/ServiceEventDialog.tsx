"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Badge,
} from "@vaahansafe/ui";
import type { ServiceHistoryTimelineEvent } from "@/lib/subscription-types";

interface ServiceEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ServiceHistoryTimelineEvent | null;
}

export function ServiceEventDialog({
  open,
  onOpenChange,
  event,
}: ServiceEventDialogProps) {
  if (!event) return null;

  const formatDate = (isoString: string) => {
    try {
      return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-md bg-card p-6 border-border">
        <DialogHeader className="space-y-1 text-left border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
              Audit Event Detail
            </span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="font-mono text-[10px] text-muted-foreground">
              {event.eventType}
            </span>
          </div>
          <DialogTitle className="font-serif text-xl font-medium text-foreground">
            {event.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Immutable server audit log record.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="rounded-xl border border-border bg-background p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">Status</span>
              <Badge variant="outline" className="border-[#5db8a6]/40 bg-[#5db8a6]/10 text-[#5db8a6] hover:bg-[#5db8a6]/15 hover:text-[#5db8a6] font-mono text-[10px]">
                {event.badgeLabel}
              </Badge>
            </div>
            <p className="text-xs text-foreground leading-relaxed">
              {event.description}
            </p>
          </div>

          <div className="divide-y divide-border rounded-xl border border-border bg-background text-xs">
            <div className="flex justify-between p-3">
              <span className="text-muted-foreground">Event Timestamp</span>
              <span className="font-mono font-bold text-foreground">
                {formatDate(event.timestamp)}
              </span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-muted-foreground">Audit ID</span>
              <span className="font-mono text-muted-foreground">
                {event.id}
              </span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-muted-foreground">Authority</span>
              <span className="font-mono text-[#5db8a6]">
                Cloudflare D1 Ledger
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
