import { Skeleton } from "@/components/ui/skeleton";

export default function VehiclesLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto py-2 space-y-6 sm:space-y-8 animate-pulse motion-reduce:animate-none">
      {/* 01. Vehicles Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2.5 w-24 bg-[#cc785c]/30 rounded-sm" />
            <Skeleton className="size-1 rounded-full bg-border" />
            <Skeleton className="h-2.5 w-28 bg-muted/60 rounded-sm" />
          </div>
          <Skeleton className="h-8 w-52 bg-muted rounded-md" />
          <Skeleton className="h-3.5 w-72 max-w-full bg-muted/60 rounded-sm" />
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Skeleton className="h-9 w-32 rounded-xl bg-[#cc785c]/40" />
        </div>
      </div>

      {/* 02. Filter Chips Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-8 w-24 rounded-lg bg-muted/70 shrink-0"
          />
        ))}
      </div>

      {/* 03. Vehicles Dossier Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5 shadow-xs flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Card Header: Type Icon & Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-xl bg-muted/80" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32 bg-muted" />
                    <Skeleton className="h-2.5 w-20 bg-muted/60" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-full bg-emerald-500/10" />
              </div>

              {/* Plate Number Placeholder */}
              <div className="rounded-xl border border-border/80 bg-muted/30 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-6 rounded-xs bg-blue-600/40" />
                  <Skeleton className="h-4 w-28 bg-muted font-mono" />
                </div>
                <Skeleton className="h-3 w-16 bg-muted/60" />
              </div>

              {/* Safety Identity Highlights */}
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <Skeleton className="h-2.5 w-24 bg-muted/60" />
                  <Skeleton className="h-2.5 w-20 bg-muted" />
                </div>
                <div className="flex items-center justify-between py-1">
                  <Skeleton className="h-2.5 w-28 bg-muted/60" />
                  <Skeleton className="h-2.5 w-16 bg-muted" />
                </div>
              </div>
            </div>

            {/* Card Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-border/60">
              <Skeleton className="h-9 flex-1 rounded-xl bg-muted/80" />
              <Skeleton className="size-9 rounded-xl bg-muted/60 shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
