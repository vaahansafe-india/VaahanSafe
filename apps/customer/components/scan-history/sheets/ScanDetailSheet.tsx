"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Badge,
  Button,
} from "@vaahansafe/ui";
import { VaahanIcon } from "@vaahansafe/icons";
import { ScanJourney } from "../journey/ScanJourney";
import type { ScanEventItem } from "@/lib/scan-history-types";

interface ScanDetailSheetProps {
  event: ScanEventItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ScanDetailSheet({
  event,
  isOpen,
  onClose,
}: ScanDetailSheetProps) {
  if (!event) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex flex-col h-full max-h-screen w-full sm:max-w-[520px] p-0 border-l border-border bg-card text-card-foreground shadow-2xl overflow-hidden"
      >
        {/* Fixed Header with clearance for Close button */}
        <SheetHeader className="sticky top-0 z-20 shrink-0 p-5 sm:p-6 pr-16 sm:pr-20 border-b border-border/70 space-y-2 text-left bg-card/95 backdrop-blur-md shadow-2xs">
          <div className="flex items-center justify-between gap-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary truncate">
              Scan Encounter Audit
            </div>
            <Badge variant={event.resultBadgeVariant} className="text-[10px] font-mono shrink-0">
              {event.resultLabel}
            </Badge>
          </div>

          <SheetTitle className="font-serif text-xl sm:text-2xl font-medium text-foreground truncate">
            {event.occurredDateFormatted} &bull; {event.occurredAtFormatted}
          </SheetTitle>

          <SheetDescription className="text-xs text-muted-foreground font-mono truncate">
            Event Reference: {event.id}
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
          {/* Linked Vehicle & Pass Card */}
          <div className="rounded-xl border border-border bg-background p-4 space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Associated Vehicle Identity
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {event.vehicleDisplay}
                </div>
                <div className="font-mono text-xs text-muted-foreground mt-0.5">
                  {event.vehiclePlate}
                </div>
              </div>
              <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
                {event.publicQrIdentity}
              </Badge>
            </div>
          </div>

          {/* Safe Access Context (Rule 38: Privacy-preserving) */}
          <div className="rounded-xl border border-border/80 bg-background/50 p-4 space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-primary">
              Safe Access Context
            </div>
            <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
              <div>
                <span className="text-muted-foreground block">Approximate Region:</span>
                <span className="font-semibold text-foreground">
                  {event.approximateRegion || "Regional Network"}
                </span>
                <span className="text-[9px] text-muted-foreground/80 block mt-0.5 font-sans">
                  (Coarse provider estimate only)
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block">Device Category:</span>
                <span className="font-semibold text-foreground">
                  {event.deviceCategory}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block">Encounter Type:</span>
                <span className="font-semibold text-foreground">
                  {event.scanTypeLabel}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block">Referrer Source:</span>
                <span className="font-semibold text-foreground">
                  {event.referrerClass}
                </span>
              </div>
            </div>
          </div>

          {/* Public View Projection Served (Rule 39) */}
          <div className="rounded-xl border border-border/80 bg-background/50 p-4 space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-primary">
              Public Safety View Dispatched
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              At the moment of encounter, the VaahanSafe Edge server dynamically resolved and served:
            </p>

            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/60">
                <span className="text-muted-foreground">Vehicle Classification:</span>
                <span className="font-semibold text-foreground">{event.vehicleType}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/60">
                <span className="text-muted-foreground">Emergency Relay:</span>
                <span className="text-emerald-600 font-semibold">Active &bull; Privacy Shielded</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/60">
                <span className="text-muted-foreground">Personal Contact Disclosure:</span>
                <span className="text-foreground">0 Phone Numbers Exposed</span>
              </div>
            </div>
          </div>

          {/* Chronological Encounter Journey */}
          <ScanJourney milestones={event.journey} />

          {/* Close Action */}
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full h-11 rounded-xl text-xs font-semibold uppercase tracking-wider"
            >
              Close Details
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
