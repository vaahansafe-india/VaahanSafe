"use client";

import { useMemo } from "react";
import { ScanFilters } from "./ScanFilters";
import { ActiveScanFilters } from "./ActiveScanFilters";
import { ScanEventGroup } from "./ScanEventGroup";
import { ScanHistoryFilteredEmpty } from "../states/ScanHistoryFilteredEmpty";
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
  // Group events chronologically by date
  const groupedEvents = useMemo(() => {
    const groups: Array<{ dateKey: string; items: ScanEventItem[] }> = [];
    const groupMap = new Map<string, ScanEventItem[]>();

    for (const evt of events) {
      if (!groupMap.has(evt.dateGroupKey)) {
        groupMap.set(evt.dateGroupKey, []);
        groups.push({ dateKey: evt.dateGroupKey, items: groupMap.get(evt.dateGroupKey)! });
      }
      groupMap.get(evt.dateGroupKey)!.push(evt);
    }

    return groups;
  }, [events]);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5 shadow-xs">
      {/* Registry Title & Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-border/70 pb-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            Security &amp; Encounter Registry
          </div>
          <h2 className="font-serif text-xl font-medium text-foreground">
            Scan Activity Stream
          </h2>
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          Showing <span className="text-foreground font-semibold">{events.length}</span>{" "}
          {events.length === 1 ? "record" : "records"}
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

      {/* Event Stream Groups */}
      {events.length === 0 ? (
        <ScanHistoryFilteredEmpty onClearFilters={onClearFilters} />
      ) : (
        <div className="space-y-6 pt-2">
          {groupedEvents.map((group) => (
            <ScanEventGroup
              key={group.dateKey}
              dateLabel={group.dateKey}
              events={group.items}
              onSelectEvent={onSelectEvent}
            />
          ))}
        </div>
      )}
    </div>
  );
}
