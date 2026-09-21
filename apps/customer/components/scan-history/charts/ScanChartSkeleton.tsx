"use client";

import { Skeleton } from "@vaahansafe/ui";

export function ScanChartSkeleton() {
  return (
    <div className="space-y-4 p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-44 rounded-lg" />
      </div>
      <Skeleton className="h-[220px] w-full rounded-xl" />
    </div>
  );
}
