"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

  const handleRangeChange = (range: DashboardFilterState["range"]) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (range === "30d") {
      params.delete("range");
    } else {
      params.set("range", range);
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  const handleReset = () => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("range");
    params.delete("qr");
    params.delete("type");
    router.push(`/dashboard?${params.toString()}`);
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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-2xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mr-1">
          RANGE:
        </span>
        <div className="flex items-center rounded-xl bg-muted/60 p-1">
          {ranges.map((r) => {
            const isActive = filterState.range === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRangeChange(r.id)}
                className={`rounded-lg px-3 py-1 font-mono text-xs transition-all ${
                  isActive
                    ? "bg-card font-bold text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {filterState.eventType && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#cc785c]/30 bg-[#cc785c]/10 px-2.5 py-1 font-mono text-[11px] text-[#cc785c]">
            Type: {filterState.eventType}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenDetailedFilters}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground hover:border-[#cc785c]/40"
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
