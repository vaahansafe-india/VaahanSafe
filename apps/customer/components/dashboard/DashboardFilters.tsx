"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { VaahanIcon } from "@vaahansafe/icons";
import type { DashboardFilterState } from "@/lib/dashboard-types";

interface DashboardFiltersProps {
  filterState: DashboardFilterState;
  onOpenDetailedFilters: () => void;
}

export function DashboardFilters({
  filterState,
  onOpenDetailedFilters,
}: DashboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = React.useTransition();

  const handleRangeChange = (range: DashboardFilterState["range"]) => {
    if (range === filterState.range) return;
    startTransition(() => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (range === "30d") {
        params.delete("range");
      } else {
        params.set("range", range);
      }
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
      router.refresh();
    });
  };

  const handleReset = () => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.delete("range");
      params.delete("qr");
      params.delete("type");
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
      router.refresh();
    });
  };

  const isFiltered =
    filterState.range !== "30d" ||
    Boolean(filterState.qrId) ||
    Boolean(filterState.eventType);

  const ranges: Array<{ id: DashboardFilterState["range"]; label: string }> = [
    { id: "today", label: "Today" },
    { id: "7d", label: "7 Days" },
    { id: "30d", label: "30 Days" },
    { id: "all", label: "All Time" },
  ];

  return (
    <div className="flex flex-col gap-2.5 sm:gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-2xs w-full max-w-full sm:flex-row sm:items-center sm:justify-between">
      {/* Mobile Top Row / Desktop Left Header */}
      <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground shrink-0 flex items-center gap-1.5">
            RANGE:
            {isPending && (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#cc785c] animate-ping" />
            )}
          </span>
          {filterState.eventType && (
            <span className="inline-flex sm:hidden items-center gap-1 rounded-md border border-[#cc785c]/30 bg-[#cc785c]/10 px-2 py-0.5 font-mono text-[10px] text-[#cc785c] truncate">
              {filterState.eventType}
            </span>
          )}
        </div>

        {/* Mobile Action Buttons (Right-aligned in top header) */}
        <div className="flex sm:hidden items-center gap-2 shrink-0">
          {isFiltered && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleReset}
              className="font-mono text-xs text-[#cc785c] hover:underline cursor-pointer disabled:opacity-50"
            >
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={onOpenDetailedFilters}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-1 text-xs text-foreground hover:border-[#cc785c]/40 shadow-2xs active:scale-95 transition-all cursor-pointer"
          >
            <VaahanIcon name="settings" size={13} className="text-muted-foreground" />
            <span>Advanced</span>
          </button>
        </div>
      </div>

      {/* Segmented Range Control — Full-width 4-column grid on mobile, inline pill on desktop */}
      <div className="flex items-center rounded-xl bg-muted/60 p-1 w-full sm:w-auto overflow-hidden">
        <div className="grid grid-cols-4 w-full sm:flex sm:w-auto gap-0.5 sm:gap-1">
          {ranges.map((r) => {
            const isActive = filterState.range === r.id;
            return (
              <button
                key={r.id}
                type="button"
                disabled={isPending}
                onClick={() => handleRangeChange(r.id)}
                className={`rounded-lg px-2 sm:px-3 py-1 font-mono text-xs transition-all text-center truncate cursor-pointer ${
                  isActive
                    ? "bg-card font-bold text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                } ${isPending ? "opacity-75 cursor-wait" : ""}`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Controls (Right-aligned) */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        {filterState.eventType && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#cc785c]/30 bg-[#cc785c]/10 px-2.5 py-1 font-mono text-[11px] text-[#cc785c]">
            Type: {filterState.eventType}
          </span>
        )}
        <button
          type="button"
          onClick={onOpenDetailedFilters}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground hover:border-[#cc785c]/40 transition-colors shadow-2xs"
        >
          <VaahanIcon name="settings" size={13} className="text-muted-foreground" />
          <span>Advanced</span>
        </button>
        {isFiltered && (
          <button
            type="button"
            onClick={handleReset}
            className="font-mono text-xs text-[#cc785c] hover:underline"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
