"use client";

import { VaahanIcon } from "@vaahansafe/icons";

interface ScanChartEmptyStateProps {
  title?: string;
  description?: string;
}

export function ScanChartEmptyState({
  title = "No Scan Signals Recorded",
  description = "No passerby or emergency scans detected during this aggregation window.",
}: ScanChartEmptyStateProps) {
  return (
    <div className="flex h-[240px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 p-6 text-center">
      <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-3">
        <VaahanIcon name="activity" size={20} />
      </div>
      <div className="font-serif text-sm font-medium text-foreground">{title}</div>
      <p className="mt-1 text-xs text-muted-foreground max-w-sm leading-relaxed">{description}</p>
    </div>
  );
}
