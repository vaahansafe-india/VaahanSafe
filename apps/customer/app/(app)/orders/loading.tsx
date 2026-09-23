import { Skeleton } from "@/components/ui/skeleton";

export default function OrdersLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-pulse motion-reduce:animate-none">
      {/* 01. Orders Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
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
          <Skeleton className="h-9 w-36 rounded-xl bg-[#cc785c]/40" />
        </div>
      </div>

      {/* 02. Fulfillment Status Rail */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-2 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-2.5 w-20 bg-muted/70" />
              <Skeleton className="size-4 rounded-sm bg-muted/50" />
            </div>
            <Skeleton className="h-7 w-16 bg-muted" />
            <Skeleton className="h-2 w-24 bg-muted/50" />
          </div>
        ))}
      </div>

      {/* 03. Orders Cards List Skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4 shadow-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-4 w-32 bg-muted font-mono" />
                  <Skeleton className="h-5 w-20 rounded-md bg-emerald-500/10" />
                </div>
                <Skeleton className="h-2.5 w-44 bg-muted/60" />
              </div>
              <Skeleton className="h-8 w-28 rounded-lg bg-muted/80 shrink-0" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="space-y-1">
                  <Skeleton className="h-2.5 w-20 bg-muted/60" />
                  <Skeleton className="h-4 w-28 bg-muted" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
