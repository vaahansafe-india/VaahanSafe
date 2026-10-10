"use client";

import { useEffect, useState } from "react";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@vaahansafe/ui/lib/utils";

export interface DocumentActivityTimelineProps {
  events: Array<{
    id: string;
    event_type: string;
    created_at: string;
  }>;
}

interface ActivityMeta {
  label: string;
  description: string;
  icon: VaahanIconName;
  badgeClass: string;
}

function getActivityMeta(rawType: string): ActivityMeta {
  const normalized = (rawType || "").trim().toLowerCase();

  if (normalized === "uploaded") {
    return {
      label: "Document uploaded",
      description: "Encrypted and secured in Vault",
      icon: "add",
      badgeClass:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    };
  }

  if (normalized === "replaced") {
    return {
      label: "New version uploaded",
      description: "Document replaced with updated file",
      icon: "refresh",
      badgeClass:
        "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25",
    };
  }

  if (normalized === "previewed") {
    return {
      label: "Previewed",
      description: "Viewed in secure document reader",
      icon: "eye",
      badgeClass:
        "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25",
    };
  }

  if (normalized === "downloaded") {
    return {
      label: "Downloaded",
      description: "Decrypted copy downloaded",
      icon: "download",
      badgeClass:
        "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25",
    };
  }

  if (normalized === "details updated" || normalized.includes("details")) {
    return {
      label: "Details updated",
      description: "Document metadata or dates modified",
      icon: "edit",
      badgeClass:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
    };
  }

  if (
    normalized.includes("security") ||
    normalized.includes("protection")
  ) {
    return {
      label: "Security policy updated",
      description: "Protection changed & active shares revoked",
      icon: "shield-alert",
      badgeClass:
        "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
    };
  }

  if (normalized === "secure link created" || normalized.includes("link created")) {
    return {
      label: "Secure link created",
      description: "Time-limited view link generated",
      icon: "share",
      badgeClass: "bg-[#cc785c]/10 text-[#cc785c] border-[#cc785c]/30",
    };
  }

  if (normalized === "share revoked" || normalized.includes("revoked")) {
    return {
      label: "Share link revoked",
      description: "Shared access link terminated",
      icon: "trash",
      badgeClass:
        "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
    };
  }

  if (
    normalized === "shared document opened" ||
    normalized.includes("shared document")
  ) {
    return {
      label: "Shared link accessed",
      description: "Opened by external recipient",
      icon: "external-link",
      badgeClass:
        "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/25",
    };
  }

  if (normalized === "deleted") {
    return {
      label: "Document deleted",
      description: "Document removed from vault",
      icon: "trash",
      badgeClass:
        "bg-destructive/10 text-destructive border-destructive/25",
    };
  }

  return {
    label: rawType || "Document activity",
    description: "Activity recorded",
    icon: "clock",
    badgeClass: "bg-muted text-muted-foreground border-border",
  };
}

function formatISTDateTime(iso: string): {
  full: string;
  relative: string;
} {
  const date = new Date(iso);
  if (isNaN(date.getTime())) {
    return { full: iso, relative: "Recently" };
  }

  const full = date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const diffMs = Date.now() - date.getTime();
  let relative = "Just now";

  if (diffMs > 0) {
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) {
      relative = "Just now";
    } else if (diffMin < 60) {
      relative = `${diffMin}m ago`;
    } else if (diffHours < 24) {
      relative = `${diffHours}h ago`;
    } else if (diffDays === 1) {
      relative = "Yesterday";
    } else if (diffDays < 7) {
      relative = `${diffDays}d ago`;
    } else {
      relative = date.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        month: "short",
        day: "numeric",
      });
    }
  }

  return { full, relative };
}

const PAGE_SIZE = 5;

export function DocumentActivityTimeline({
  events,
}: DocumentActivityTimelineProps) {
  const [page, setPage] = useState(1);

  // Automatically reset to page 1 whenever a new document's events are passed
  const firstId = events[0]?.id;
  useEffect(() => {
    setPage(1);
  }, [firstId, events.length]);

  if (!events || events.length === 0) {
    return (
      <section className="space-y-3 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <VaahanIcon name="activity" size={16} className="text-[#cc785c]" />
            Activity
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/15 py-7 px-4 text-center">
          <div className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
            <VaahanIcon name="clock" size={16} />
          </div>
          <p className="text-xs font-medium text-foreground">
            No activity recorded
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Document views, shares, and updates will be logged here.
          </p>
        </div>
      </section>
    );
  }

  const totalPages = Math.max(1, Math.ceil(events.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const displayedEvents = events.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <section className="space-y-3 border-t border-border pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <VaahanIcon name="activity" size={16} className="text-[#cc785c]" />
            Activity
          </h3>
          <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {events.length} {events.length === 1 ? "entry" : "entries"}
          </span>
        </div>
        {totalPages > 1 && (
          <span className="text-[11px] font-mono text-muted-foreground">
            Page {safePage} of {totalPages}
          </span>
        )}
      </div>

      {/* Vertical Timeline */}
      <div className="pt-1">
        {displayedEvents.map((event, idx) => {
          const isLast = idx === displayedEvents.length - 1;
          const meta = getActivityMeta(event.event_type);
          const dt = formatISTDateTime(event.created_at);

          return (
            <div key={event.id} className="relative flex gap-3 group">
              {/* Node indicator & vertical line */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border shadow-2xs transition-transform group-hover:scale-105",
                    meta.badgeClass,
                  )}
                  title={meta.label}
                >
                  <VaahanIcon name={meta.icon} size={12} />
                </div>
                {!isLast && (
                  <div className="w-px flex-1 my-1 bg-border/70 group-hover:bg-primary/25 transition-colors" />
                )}
              </div>

              {/* Content card */}
              <div
                className={cn(
                  "flex-1 min-w-0",
                  !isLast ? "pb-3.5" : "pb-1",
                )}
              >
                <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 transition-all hover:border-border hover:bg-muted/40">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-xs font-medium text-foreground tracking-tight">
                      {meta.label}
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {dt.relative}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                    <span className="truncate">{meta.description}</span>
                    <span className="font-mono text-[10px] text-muted-foreground/80 shrink-0">
                      {dt.full} IST
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
          <span className="text-[11px] text-muted-foreground">
            Showing {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, events.length)} of {events.length}
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              aria-label="Previous activity page"
            >
              <VaahanIcon name="chevron-left" size={13} />
              <span className="hidden sm:inline">Prev</span>
            </Button>

            {/* Mobile compact page indicator */}
            <div className="flex items-center gap-1 sm:hidden">
              <span className="text-xs font-mono px-1.5 text-muted-foreground">
                {safePage} / {totalPages}
              </span>
            </div>

            {/* Desktop / tablet number buttons */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === safePage ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "size-7 p-0 text-xs font-mono",
                    p === safePage &&
                      "bg-primary text-primary-foreground font-semibold",
                  )}
                  onClick={() => setPage(p)}
                  aria-label={`Go to page ${p}`}
                  aria-current={p === safePage ? "page" : undefined}
                >
                  {p}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              aria-label="Next activity page"
            >
              <span className="hidden sm:inline">Next</span>
              <VaahanIcon name="chevron-right" size={13} />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
