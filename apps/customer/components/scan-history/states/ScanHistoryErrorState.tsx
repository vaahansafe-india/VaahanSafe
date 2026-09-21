"use client";

import { Button } from "@vaahansafe/ui";
import { VaahanIcon } from "@vaahansafe/icons";

interface ScanHistoryErrorStateProps {
  onRetry?: () => void;
}

export function ScanHistoryErrorState({ onRetry }: ScanHistoryErrorStateProps) {
  return (
    <div className="rounded-2xl border border-destructive/20 bg-card p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto my-12 shadow-xs">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20">
        <VaahanIcon name="alert" size={28} />
      </div>

      <div className="space-y-1.5">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-destructive">
          Operational Error
        </div>
        <h2 className="font-serif text-2xl font-medium text-foreground">
          We couldn&apos;t load scan history.
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
          A temporary network interruption occurred while connecting to the telemetry pipeline. Please try again.
        </p>
      </div>

      <div className="pt-2">
        <Button
          onClick={() => {
            if (onRetry) onRetry();
            else window.location.reload();
          }}
          className="h-10 px-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold uppercase tracking-wider gap-2 shadow-xs"
        >
          <VaahanIcon name="refresh" size={14} />
          <span>Retry</span>
        </Button>
      </div>
    </div>
  );
}
