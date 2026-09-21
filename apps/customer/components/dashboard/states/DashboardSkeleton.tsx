import * as React from "react";

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col justify-between gap-4 border-b border-border/60 pb-6 lg:flex-row lg:items-end">
        <div className="space-y-2">
          <div className="h-3 w-40 rounded bg-muted" />
          <div className="h-8 w-64 rounded bg-muted" />
          <div className="h-4 w-96 rounded bg-muted" />
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-24 rounded-xl bg-muted" />
          <div className="h-9 w-9 rounded-xl bg-muted" />
          <div className="h-9 w-40 rounded-xl bg-muted" />
        </div>
      </div>

      {/* Hero Core Skeleton */}
      <div className="h-64 rounded-3xl bg-muted/40" />

      {/* Readiness Rail Skeleton */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted/30" />
        ))}
      </div>

      {/* Command Deck Skeleton */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-muted/20" />
        ))}
      </div>

      {/* Visual Instruments Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="h-80 rounded-3xl bg-muted/40 lg:col-span-8" />
        <div className="h-80 rounded-3xl bg-muted/30 lg:col-span-4" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-3xl bg-muted/30" />
        <div className="h-72 rounded-3xl bg-muted/30" />
      </div>
    </div>
  );
}
