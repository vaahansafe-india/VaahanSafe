import { Skeleton } from "@/components/ui/skeleton";

export default function DefaultAppLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-pulse motion-reduce:animate-none">
      {/* Editorial Header Skeleton */}
      <div className="space-y-2 pb-2">
        <Skeleton className="h-3 w-36 rounded-sm bg-muted/80" />
        <Skeleton className="h-8 w-64 rounded-md bg-muted" />
        <Skeleton className="h-4 w-96 max-w-full rounded-sm bg-muted/60" />
      </div>

      {/* Signal / Metric Rail Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-4 space-y-2.5 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-2.5 w-20 bg-muted/70" />
              <Skeleton className="size-4 rounded-sm bg-muted/50" />
            </div>
            <Skeleton className="h-7 w-24 bg-muted" />
            <Skeleton className="h-2.5 w-32 bg-muted/50" />
          </div>
        ))}
      </div>

      {/* Main Content Workspace Skeleton */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <Skeleton className="h-5 w-48 bg-muted" />
          <Skeleton className="h-8 w-28 rounded-lg bg-muted/70" />
        </div>
        <div className="space-y-3 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b border-border/60 last:border-0"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-lg bg-muted/60" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-40 bg-muted" />
                  <Skeleton className="h-2.5 w-60 bg-muted/60" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-md bg-muted/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
