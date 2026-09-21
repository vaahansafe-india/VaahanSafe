"use client";

import { Skeleton } from "@vaahansafe/ui";

export function PaymentsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="border-b border-border/80 pb-6 space-y-3">
        <Skeleton className="h-3 w-32 bg-muted" />
        <Skeleton className="h-9 w-64 bg-muted" />
        <Skeleton className="h-4 w-96 max-w-full bg-muted" />
      </div>

      {/* Signal Rail Skeleton */}
      <div className="rounded-2xl border border-border bg-card p-5 h-28 flex items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-20 bg-muted" />
          <Skeleton className="h-7 w-28 bg-muted" />
        </div>
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-20 bg-muted" />
          <Skeleton className="h-7 w-16 bg-muted" />
        </div>
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-20 bg-muted" />
          <Skeleton className="h-7 w-16 bg-muted" />
        </div>
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-20 bg-muted" />
          <Skeleton className="h-7 w-28 bg-muted" />
        </div>
      </div>

      {/* Visualizations Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-2xl border border-border bg-card p-6 h-48 space-y-3">
          <Skeleton className="h-3 w-24 bg-muted" />
          <Skeleton className="h-5 w-40 bg-muted" />
          <Skeleton className="h-20 w-full bg-muted/60" />
        </div>
        <div className="lg:col-span-4 rounded-2xl border border-border bg-card p-6 h-48 space-y-3">
          <Skeleton className="h-3 w-24 bg-muted" />
          <Skeleton className="h-5 w-40 bg-muted" />
          <Skeleton className="h-20 w-full bg-muted/60" />
        </div>
      </div>

      {/* Filters & Records Skeleton */}
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-9 w-64 bg-muted" />
          <Skeleton className="h-9 w-48 bg-muted" />
        </div>
        <Skeleton className="h-24 w-full rounded-2xl border border-border bg-card" />
        <Skeleton className="h-24 w-full rounded-2xl border border-border bg-card" />
      </div>
    </div>
  );
}
