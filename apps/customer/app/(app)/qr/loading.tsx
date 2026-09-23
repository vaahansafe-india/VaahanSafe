import { Skeleton } from "@/components/ui/skeleton";

export default function QrLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-pulse motion-reduce:animate-none">
      {/* 01. QR Hub Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2.5 w-24 bg-[#cc785c]/30 rounded-sm" />
            <Skeleton className="size-1 rounded-full bg-border" />
            <Skeleton className="h-2.5 w-28 bg-muted/60 rounded-sm" />
          </div>
          <Skeleton className="h-8 w-56 bg-muted rounded-md" />
          <Skeleton className="h-3.5 w-80 max-w-full bg-muted/60 rounded-sm" />
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Skeleton className="h-9 w-32 rounded-xl bg-muted" />
          <Skeleton className="h-9 w-28 rounded-xl bg-[#cc785c]/40" />
        </div>
      </div>

      {/* 02. QR Identity Hero Card Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* QR Visual & Code (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-border bg-card p-6 sm:p-7 flex flex-col items-center justify-center space-y-5 text-center shadow-xs">
          <Skeleton className="size-48 sm:size-52 rounded-2xl bg-muted/80 shadow-xs" />
          <div className="space-y-2 w-full max-w-xs">
            <Skeleton className="h-5 w-32 mx-auto bg-muted font-mono" />
            <Skeleton className="h-3 w-48 mx-auto bg-muted/60 font-mono" />
          </div>
          <div className="flex items-center gap-2 pt-1 w-full max-w-xs">
            <Skeleton className="h-9 flex-1 rounded-xl bg-muted/70" />
            <Skeleton className="h-9 flex-1 rounded-xl bg-[#cc785c]/30" />
          </div>
        </div>

        {/* QR Lifecycle State & Binding Dossier (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-border bg-card p-6 sm:p-7 space-y-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-36 bg-muted/70" />
              <Skeleton className="h-5 w-20 rounded-full bg-emerald-500/10" />
            </div>
            <Skeleton className="h-7 w-56 bg-muted" />
            <Skeleton className="h-3.5 w-full bg-muted/60" />

            {/* Signal Rail Nodes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-1.5">
                  <Skeleton className="h-2 w-12 bg-muted/60" />
                  <Skeleton className="h-3.5 w-16 bg-muted" />
                </div>
              ))}
            </div>
          </div>

          {/* Linked Vehicle Strip */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-lg bg-muted/70" />
              <div className="space-y-1">
                <Skeleton className="h-3.5 w-32 bg-muted" />
                <Skeleton className="h-2.5 w-24 bg-muted/60" />
              </div>
            </div>
            <Skeleton className="h-7 w-20 rounded-lg bg-muted" />
          </div>
        </div>
      </div>

      {/* 03. Action Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-8 rounded-lg bg-muted/70" />
              <Skeleton className="h-4 w-32 bg-muted" />
            </div>
            <Skeleton className="h-3 w-full bg-muted/60" />
            <Skeleton className="h-3 w-4/5 bg-muted/60" />
            <Skeleton className="h-8 w-28 rounded-lg bg-muted/80 mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
