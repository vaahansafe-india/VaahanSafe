"use client";

import React from "react";
import { Skeleton } from "@vaahansafe/ui";

export function ContactsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28 rounded-md" />
          <Skeleton className="h-9 w-72 rounded-lg" />
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Safety Boundary Banner Skeleton */}
      <Skeleton className="h-12 w-full rounded-2xl" />

      {/* Hero Constellation + Overview Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Skeleton className="h-[340px] w-full rounded-3xl" />
        </div>
        <div className="lg:col-span-5 space-y-4">
          <Skeleton className="h-[160px] w-full rounded-3xl" />
          <Skeleton className="h-[160px] w-full rounded-3xl" />
        </div>
      </div>

      {/* Signal Rail Skeleton */}
      <Skeleton className="h-14 w-full rounded-2xl" />

      {/* Registry Skeleton */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>
        <div className="divide-y divide-border/60">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-2xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36 rounded-md" />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-8 w-20 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
