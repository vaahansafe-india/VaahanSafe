import { Skeleton } from "@/components/ui/skeleton";

export default function SubscriptionLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-pulse motion-reduce:animate-none">
      {/* 01. Subscription Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2.5 w-24 bg-[#cc785c]/30 rounded-sm" />
            <Skeleton className="size-1 rounded-full bg-border" />
            <Skeleton className="h-2.5 w-32 bg-muted/60 rounded-sm" />
          </div>
          <Skeleton className="h-8 w-64 sm:w-72 bg-muted rounded-md" />
          <Skeleton className="h-3.5 w-96 max-w-full bg-muted/60 rounded-sm" />
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Skeleton className="h-9 w-40 rounded-xl bg-muted" />
        </div>
      </div>

      {/* 02. Service Passport Card Skeleton */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-28 bg-muted/70" />
              <Skeleton className="h-5 w-24 rounded-full bg-emerald-500/10" />
            </div>
            <Skeleton className="h-7 w-48 bg-muted" />
            <Skeleton className="h-3 w-64 bg-muted/60" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl bg-[#cc785c]/30 shrink-0" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-2.5 w-20 bg-muted/60" />
              <Skeleton className="h-4 w-28 bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* 03. Service Capabilities Grid Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-44 bg-muted" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="size-8 rounded-lg bg-muted/70" />
                <Skeleton className="h-4 w-16 rounded-md bg-emerald-500/10" />
              </div>
              <Skeleton className="h-4 w-36 bg-muted" />
              <Skeleton className="h-3 w-full bg-muted/60" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
