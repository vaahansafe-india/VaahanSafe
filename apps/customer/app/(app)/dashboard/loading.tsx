import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-pulse motion-reduce:animate-none">
      {/* 01. Dashboard Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2.5 w-24 bg-[#cc785c]/30 rounded-sm" />
            <Skeleton className="size-1 rounded-full bg-border" />
            <Skeleton className="h-2.5 w-32 bg-muted/60 rounded-sm" />
          </div>
          <Skeleton className="h-8 w-60 sm:w-72 bg-muted rounded-md" />
          <Skeleton className="h-3.5 w-80 max-w-full bg-muted/60 rounded-sm" />
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Skeleton className="h-9 w-40 rounded-xl bg-muted" />
          <Skeleton className="h-9 w-28 rounded-xl bg-muted/70" />
        </div>
      </div>

      {/* 02. Identity Hero & Readiness Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left: Vehicle Identity Card (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-border bg-card p-6 sm:p-7 space-y-5 shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-28 bg-muted/70 rounded-sm" />
              <Skeleton className="h-7 w-48 bg-muted rounded-md" />
              <div className="flex items-center gap-2 pt-1">
                <Skeleton className="h-6 w-32 rounded-lg bg-muted/80" />
                <Skeleton className="h-6 w-20 rounded-lg bg-emerald-500/10" />
              </div>
            </div>
            <Skeleton className="size-14 sm:size-16 rounded-2xl bg-muted/60 shrink-0" />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/60">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-2.5 w-16 bg-muted/60" />
                <Skeleton className="h-4 w-20 bg-muted" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Readiness / Health State (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-border bg-card p-6 sm:p-7 flex flex-col justify-between space-y-5 shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-32 bg-muted/70" />
              <Skeleton className="h-5 w-16 rounded-full bg-emerald-500/10" />
            </div>
            <Skeleton className="h-6 w-44 bg-muted" />
            <Skeleton className="h-3.5 w-full bg-muted/60" />
          </div>

          <div className="space-y-2 pt-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="size-4 rounded-full bg-muted/80" />
                  <Skeleton className="h-3 w-28 bg-muted" />
                </div>
                <Skeleton className="h-4 w-14 rounded-md bg-muted/60" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 03. Telemetry Pulse & Scan Visualization Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4 shadow-xs"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <Skeleton className="h-3 w-28 bg-muted/70" />
              <Skeleton className="size-5 rounded-md bg-muted/50" />
            </div>
            <Skeleton className="h-28 w-full rounded-xl bg-muted/40" />
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-3 w-20 bg-muted/60" />
              <Skeleton className="h-3 w-16 bg-muted/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
