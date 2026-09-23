"use client";

import { useState, useMemo } from "react";
import { ScanFilters } from "./ScanFilters";
import { ActiveScanFilters } from "./ActiveScanFilters";
import { ScanEventGroup } from "./ScanEventGroup";
import { ScanHistoryFilteredEmpty } from "../states/ScanHistoryFilteredEmpty";
import { VaahanIcon } from "@vaahansafe/icons";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import type {
  ScanEventItem,
  ScanHistoryFilterState,
  AuthorizedVehicleScope,
  AuthorizedQrScope,
} from "@/lib/scan-history-types";

interface ScanEventRegistryProps {
  events: ScanEventItem[];
  filters: ScanHistoryFilterState;
  vehicles: AuthorizedVehicleScope[];
  qrs: AuthorizedQrScope[];
  onFilterChange: (updates: Partial<ScanHistoryFilterState>) => void;
  onClearFilters: () => void;
  onRemoveFilter: (key: keyof ScanHistoryFilterState) => void;
  onSelectEvent: (event: ScanEventItem) => void;
  onOpenFilterSheet: () => void;
  onOpenMobileDrawer: () => void;
}

type QuickDateTab = "ALL" | "TODAY" | "YESTERDAY" | "OLDER";

export function ScanEventRegistry({
  events,
  filters,
  vehicles,
  qrs,
  onFilterChange,
  onClearFilters,
  onRemoveFilter,
  onSelectEvent,
  onOpenFilterSheet,
  onOpenMobileDrawer,
}: ScanEventRegistryProps) {
  // Quick date tab filter
  const [quickDateTab, setQuickDateTab] = useState<QuickDateTab>("ALL");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter events by quick date tab if selected
  const tabFilteredEvents = useMemo(() => {
    if (quickDateTab === "ALL") return events;
    if (quickDateTab === "TODAY") {
      return events.filter((e) => e.dateGroupKey.toUpperCase() === "TODAY");
    }
    if (quickDateTab === "YESTERDAY") {
      return events.filter((e) => e.dateGroupKey.toUpperCase() === "YESTERDAY");
    }
    return events.filter(
      (e) =>
        e.dateGroupKey.toUpperCase() !== "TODAY" &&
        e.dateGroupKey.toUpperCase() !== "YESTERDAY"
    );
  }, [events, quickDateTab]);

  // Total pages calculation
  const totalEvents = tabFilteredEvents.length;
  const totalPages = Math.max(1, Math.ceil(totalEvents / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  // Paginated slice
  const paginatedEvents = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return tabFilteredEvents.slice(start, start + pageSize);
  }, [tabFilteredEvents, safeCurrentPage, pageSize]);

  // Group paginated events by date for accordion display
  const groupedEvents = useMemo(() => {
    const groups: Array<{ dateKey: string; items: ScanEventItem[] }> = [];
    const groupMap = new Map<string, ScanEventItem[]>();

    for (const evt of paginatedEvents) {
      if (!groupMap.has(evt.dateGroupKey)) {
        groupMap.set(evt.dateGroupKey, []);
        groups.push({ dateKey: evt.dateGroupKey, items: groupMap.get(evt.dateGroupKey)! });
      }
      groupMap.get(evt.dateGroupKey)!.push(evt);
    }

    return groups;
  }, [paginatedEvents]);

  // Reset to page 1 on tab change
  const handleTabChange = (tab: QuickDateTab) => {
    setQuickDateTab(tab);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    const target = Math.max(1, Math.min(newPage, totalPages));
    setCurrentPage(target);
  };

  // Counts for quick tabs
  const todayCount = useMemo(
    () => events.filter((e) => e.dateGroupKey.toUpperCase() === "TODAY").length,
    [events]
  );
  const yesterdayCount = useMemo(
    () => events.filter((e) => e.dateGroupKey.toUpperCase() === "YESTERDAY").length,
    [events]
  );
  const olderCount = useMemo(
    () =>
      events.filter(
        (e) =>
          e.dateGroupKey.toUpperCase() !== "TODAY" &&
          e.dateGroupKey.toUpperCase() !== "YESTERDAY"
      ).length,
    [events]
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-5 shadow-xs">
      {/* Registry Title & Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/70 pb-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            Security &amp; Encounter Registry
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-medium text-foreground">
            Scan Activity Stream
          </h2>
        </div>

        {/* Quick Date Scope Selector */}
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-background p-1 text-[11px] font-mono">
          <button
            type="button"
            onClick={() => handleTabChange("ALL")}
            className={`px-3 py-1 rounded-lg transition-all font-medium cursor-pointer ${
              quickDateTab === "ALL"
                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({events.length})
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("TODAY")}
            className={`px-3 py-1 rounded-lg transition-all font-medium cursor-pointer ${
              quickDateTab === "TODAY"
                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Today ({todayCount})
          </button>
          {yesterdayCount > 0 && (
            <button
              type="button"
              onClick={() => handleTabChange("YESTERDAY")}
              className={`px-3 py-1 rounded-lg transition-all font-medium cursor-pointer ${
                quickDateTab === "YESTERDAY"
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yesterday ({yesterdayCount})
            </button>
          )}
          {olderCount > 0 && (
            <button
              type="button"
              onClick={() => handleTabChange("OLDER")}
              className={`px-3 py-1 rounded-lg transition-all font-medium cursor-pointer ${
                quickDateTab === "OLDER"
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Older ({olderCount})
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <ScanFilters
        filters={filters}
        vehicles={vehicles}
        onFilterChange={onFilterChange}
        onOpenFilterSheet={onOpenFilterSheet}
        onOpenMobileDrawer={onOpenMobileDrawer}
        totalFilteredCount={events.length}
      />

      {/* Active Filter Pills */}
      <ActiveScanFilters
        filters={filters}
        vehicles={vehicles}
        qrs={qrs}
        onRemoveFilter={onRemoveFilter}
        onClearAll={onClearFilters}
      />

      {/* Event Stream Groups (Accordion Type by Day) */}
      {totalEvents === 0 ? (
        <ScanHistoryFilteredEmpty onClearFilters={onClearFilters} />
      ) : (
        <div className="space-y-4 pt-1">
          {groupedEvents.map((group) => (
            <ScanEventGroup
              key={group.dateKey}
              dateLabel={group.dateKey}
              events={group.items}
              defaultOpen={true}
              onSelectEvent={onSelectEvent}
            />
          ))}
        </div>
      )}

      {/* Professional Pagination Deck */}
      {totalEvents > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60 pt-4 text-xs font-mono">
          {/* Status summary */}
          <div className="text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {Math.min(totalEvents, (safeCurrentPage - 1) * pageSize + 1)}
            </span>
            –
            <span className="font-semibold text-foreground">
              {Math.min(safeCurrentPage * pageSize, totalEvents)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{totalEvents}</span>{" "}
            {totalEvents === 1 ? "encounter" : "encounters"}
          </div>

          {/* Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              {/* First page button */}
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                disabled={safeCurrentPage === 1}
                aria-label="First page"
                className="flex size-8 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronsLeft className="size-4" />
              </button>

              {/* Prev button */}
              <button
                type="button"
                onClick={() => handlePageChange(safeCurrentPage - 1)}
                disabled={safeCurrentPage === 1}
                aria-label="Previous page"
                className="flex size-8 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="size-4" />
              </button>

              {/* Page Number Pills */}
              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show current page, first, last, and immediate neighbors
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - safeCurrentPage) <= 1
                    );
                  })
                  .map((page, index, arr) => {
                    const prevPage = arr[index - 1];
                    const hasGap = prevPage && page - prevPage > 1;

                    return (
                      <span key={page} className="flex items-center">
                        {hasGap && (
                          <span className="px-1 text-muted-foreground font-sans">…</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handlePageChange(page)}
                          className={`size-8 rounded-lg font-mono text-xs font-semibold transition-colors ${
                            page === safeCurrentPage
                              ? "bg-primary text-primary-foreground font-bold shadow-xs"
                              : "border border-border bg-background hover:bg-muted text-foreground"
                          }`}
                        >
                          {page}
                        </button>
                      </span>
                    );
                  })}
              </div>

              {/* Next button */}
              <button
                type="button"
                onClick={() => handlePageChange(safeCurrentPage + 1)}
                disabled={safeCurrentPage === totalPages}
                aria-label="Next page"
                className="flex size-8 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight className="size-4" />
              </button>

              {/* Last page button */}
              <button
                type="button"
                onClick={() => handlePageChange(totalPages)}
                disabled={safeCurrentPage === totalPages}
                aria-label="Last page"
                className="flex size-8 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronsRight className="size-4" />
              </button>
            </div>
          )}

          {/* Page size picker if many scans */}
          {totalEvents > 10 && (
            <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground text-[11px]">
              <span>Per page:</span>
              {[10, 25, 50].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => {
                    setPageSize(sz);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold transition-colors ${
                    pageSize === sz
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
