"use client";

import { Skeleton } from "@vaahansafe/ui/components";

export function OrdersSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero Skeleton */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-4 w-96 max-w-full" />
            <div className="flex gap-4 pt-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
          <div className="lg:col-span-5">
            <Skeleton className="aspect-4/3 w-full rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Tabs & Filters Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>

      {/* Order Cards Skeleton */}
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <Skeleton className="size-24 rounded-xl" />
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-60" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
            <Skeleton className="h-12 w-full rounded-lg" />
            <div className="grid grid-cols-4 gap-4 border-t border-border/60 pt-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
