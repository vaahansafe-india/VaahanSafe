import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-pulse motion-reduce:animate-none">
      {/* 01. Notifications Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2.5 w-24 bg-[#cc785c]/30 rounded-sm" />
            <Skeleton className="size-1 rounded-full bg-border" />
            <Skeleton className="h-2.5 w-32 bg-muted/60 rounded-sm" />
          </div>
          <Skeleton className="h-8 w-64 sm:w-72 bg-muted rounded-md" />
          <Skeleton className="h-3.5 w-80 max-w-full bg-muted/60 rounded-sm" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Skeleton className="h-9 w-32 rounded-xl bg-muted/70" />
        </div>
      </div>

      {/* 02. Filter Tabs Skeleton */}
      <div className="flex items-center gap-2 pb-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-lg bg-muted/70" />
        ))}
      </div>

      {/* 03. Notification Items List Skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-4 sm:p-5 flex items-start gap-4 shadow-xs"
          >
            <Skeleton className="size-10 rounded-xl bg-muted/80 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-44 bg-muted" />
                <Skeleton className="h-3 w-16 bg-muted/60" />
              </div>
              <Skeleton className="h-3 w-full max-w-xl bg-muted/60" />
              <Skeleton className="h-2.5 w-32 bg-muted/50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
