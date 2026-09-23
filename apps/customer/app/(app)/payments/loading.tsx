import { Skeleton } from "@/components/ui/skeleton";

export default function PaymentsLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-pulse motion-reduce:animate-none">
      {/* 01. Payments Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2.5 w-24 bg-[#cc785c]/30 rounded-sm" />
            <Skeleton className="size-1 rounded-full bg-border" />
            <Skeleton className="h-2.5 w-32 bg-muted/60 rounded-sm" />
          </div>
          <Skeleton className="h-8 w-64 bg-muted rounded-md" />
          <Skeleton className="h-3.5 w-96 max-w-full bg-muted/60 rounded-sm" />
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Skeleton className="h-9 w-28 rounded-xl bg-muted/70" />
        </div>
      </div>

      {/* 02. Payment Signal Rail (3 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-5 space-y-2 shadow-xs"
          >
            <Skeleton className="h-2.5 w-24 bg-muted/70" />
            <Skeleton className="h-8 w-24 bg-muted rounded-md" />
            <Skeleton className="h-2 w-32 bg-muted/50" />
          </div>
        ))}
      </div>

      {/* 03. Payments Table Skeleton */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <Skeleton className="h-4 w-40 bg-muted" />
          <Skeleton className="h-8 w-32 rounded-lg bg-muted/70" />
        </div>
        <div className="space-y-3 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3.5 border-b border-border/40 last:border-0"
            >
              <div className="flex items-center gap-3.5">
                <Skeleton className="size-9 rounded-xl bg-muted/70 shrink-0" />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-28 bg-muted font-mono" />
                    <Skeleton className="h-4 w-16 rounded-md bg-emerald-500/10" />
                  </div>
                  <Skeleton className="h-2.5 w-44 bg-muted/60" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-16 bg-muted font-mono" />
                <Skeleton className="h-8 w-20 rounded-lg bg-muted/80 hidden sm:block" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
