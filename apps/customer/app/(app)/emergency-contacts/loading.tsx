import { Skeleton } from "@/components/ui/skeleton";

export default function EmergencyContactsLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-pulse motion-reduce:animate-none">
      {/* 01. Emergency Contacts Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2.5 w-24 bg-[#cc785c]/30 rounded-sm" />
            <Skeleton className="size-1 rounded-full bg-border" />
            <Skeleton className="h-2.5 w-32 bg-muted/60 rounded-sm" />
          </div>
          <Skeleton className="h-8 w-64 sm:w-80 bg-muted rounded-md" />
          <Skeleton className="h-3.5 w-96 max-w-full bg-muted/60 rounded-sm" />
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Skeleton className="h-9 w-36 rounded-xl bg-[#cc785c]/40" />
        </div>
      </div>

      {/* 02. Priority Contact Network Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4 shadow-xs"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl bg-muted/80" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28 bg-muted" />
                  <Skeleton className="h-2.5 w-16 bg-muted/60" />
                </div>
              </div>
              <Skeleton className="h-5 w-16 rounded-full bg-[#cc785c]/10" />
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/30 p-3 space-y-1">
              <Skeleton className="h-2 w-16 bg-muted/60" />
              <Skeleton className="h-3.5 w-32 bg-muted font-mono" />
            </div>

            <div className="space-y-2 pt-1 border-t border-border/50 text-xs">
              <div className="flex items-center justify-between py-1">
                <Skeleton className="h-2.5 w-24 bg-muted/60" />
                <Skeleton className="h-4 w-8 rounded-full bg-muted" />
              </div>
              <div className="flex items-center justify-between py-1">
                <Skeleton className="h-2.5 w-24 bg-muted/60" />
                <Skeleton className="h-4 w-8 rounded-full bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
