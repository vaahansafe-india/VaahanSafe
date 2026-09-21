"use client";

import { Skeleton } from "@vaahansafe/ui";

export function ScanHistorySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-border/70 pb-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-9 w-72 rounded-lg" />
          <Skeleton className="h-4 w-96 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-11 w-48 rounded-xl" />
          <Skeleton className="h-11 w-24 rounded-xl" />
        </div>
      </div>

      {/* Signal Rail Skeleton */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </div>

      {/* Signature Chart Skeleton */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-8 w-44 rounded-lg" />
        </div>
        <Skeleton className="h-[240px] w-full rounded-xl" />
      </div>

      {/* Secondary Charts 2-column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-[140px] w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-[140px] w-full rounded-xl" />
        </div>
      </div>

      {/* Registry Rows Skeleton */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="space-y-3 pt-2">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
