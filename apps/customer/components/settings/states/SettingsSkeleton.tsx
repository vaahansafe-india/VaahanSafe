import * as React from "react";
import { Skeleton } from "@vaahansafe/ui";

export function SettingsSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
      {/* Desktop Navigation Skeleton */}
      <div className="hidden lg:block w-56 shrink-0 space-y-6">
        <Skeleton className="h-8 w-full rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-full rounded-md" />
          <Skeleton className="h-7 w-full rounded-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-full rounded-md" />
          <Skeleton className="h-7 w-full rounded-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-full rounded-md" />
          <Skeleton className="h-7 w-full rounded-md" />
        </div>
      </div>

      {/* Content Workspace Skeleton */}
      <div className="flex-1 max-w-3xl space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
