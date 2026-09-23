"use client";

import Link from "next/link";
import { Button } from "@vaahansafe/ui";
import { VaahanIcon } from "@vaahansafe/icons";

interface ScanHistoryEmptyStateProps {
  hasActiveQr: boolean;
}

export function ScanHistoryEmptyState({ hasActiveQr }: ScanHistoryEmptyStateProps) {
  if (!hasActiveQr) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 sm:p-12 text-center space-y-5 max-w-xl mx-auto my-8 shadow-xs">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
          <VaahanIcon name="qr-code" size={28} />
        </div>

        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
            Service Inactive
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-foreground">
            No Active Vehicle Pass
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            Connect a genuine VaahanSafe physical QR sticker to your vehicle to begin receiving encounter telemetry and emergency safety pass services.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            asChild
            className="w-full sm:w-auto h-11 px-6 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold uppercase tracking-wider shadow-xs"
          >
            <Link href="/qr/buy">
              Buy Vehicle QR Pass
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto h-11 px-6 rounded-xl border-border bg-card hover:bg-muted/60 text-xs font-semibold uppercase tracking-wider shadow-xs"
          >
            <Link href="/qr/activate">
              Activate Retail Pack
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Active QR exists, but zero scans recorded yet
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 sm:p-12 text-center space-y-5 max-w-xl mx-auto my-8 shadow-xs">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
        <VaahanIcon name="activity" size={28} />
      </div>

      <div className="space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
          Pass Standing By
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-medium text-foreground">
          Your QR hasn&apos;t recorded any scan activity yet.
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          Scan encounters will appear here whenever a passerby or first-responder encounters your vehicle sticker and accesses the emergency safety view.
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button
          asChild
          variant="outline"
          className="h-11 px-5 rounded-xl border-border bg-card hover:bg-muted/60 text-xs font-semibold uppercase tracking-wider gap-2 shadow-xs"
        >
          <Link href="/qr">
            <VaahanIcon name="qr-code" size={15} />
            <span>View My QR Pass</span>
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          className="h-11 px-5 rounded-xl border-border bg-card hover:bg-muted/60 text-xs font-semibold uppercase tracking-wider gap-2 shadow-xs"
        >
          <Link href="/emergency-contacts">
            <VaahanIcon name="phone" size={15} />
            <span>Emergency Contacts</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
