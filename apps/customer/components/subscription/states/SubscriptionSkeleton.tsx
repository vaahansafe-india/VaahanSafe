"use client";

import * as React from "react";
import { Skeleton } from "@vaahansafe/ui";

export function SubscriptionSkeleton() {
  return (
    <div className="space-y-8 w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36 rounded-md" />
          <Skeleton className="h-9 w-72 sm:w-96 rounded-lg" />
          <Skeleton className="h-4 w-60 sm:w-80 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9.5 w-40 rounded-xl" />
          <Skeleton className="h-9.5 w-32 rounded-xl" />
        </div>
      </div>

      {/* Principle Surface Skeleton */}
      <Skeleton className="h-24 w-full rounded-2xl" />

      {/* Service Passport Skeleton */}
      <Skeleton className="h-80 w-full rounded-3xl" />

      {/* Relationship Rail Skeleton */}
      <Skeleton className="h-44 w-full rounded-2xl" />

      {/* Connected Vehicles Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-48 rounded-md" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>

      {/* Capability Ledger Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-40 rounded-md" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </div>
  );
}
