"use client";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@vaahansafe/ui";
import { VaahanIcon } from "@vaahansafe/icons";
import { ScanSearch } from "./ScanSearch";
import type {
  ScanHistoryFilterState,
  AuthorizedVehicleScope,
} from "@/lib/scan-history-types";

interface ScanFiltersProps {
  filters: ScanHistoryFilterState;
  vehicles: AuthorizedVehicleScope[];
  onFilterChange: (updates: Partial<ScanHistoryFilterState>) => void;
  onOpenFilterSheet: () => void;
  onOpenMobileDrawer: () => void;
  totalFilteredCount: number;
}

export function ScanFilters({
  filters,
  vehicles,
  onFilterChange,
  onOpenFilterSheet,
  onOpenMobileDrawer,
  totalFilteredCount,
}: ScanFiltersProps) {
  // Count active non-default filters
  let activeFilterCount = 0;
  if (filters.period !== "30D" && filters.period !== "ALL") activeFilterCount++;
  if (filters.vehicleId !== "all") activeFilterCount++;
  if (filters.qrPublicId !== "all") activeFilterCount++;
  if (filters.eventType !== "all") activeFilterCount++;
  if (filters.deviceCategory !== "all") activeFilterCount++;
  if (filters.search) activeFilterCount++;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Left: Search input */}
      <ScanSearch
        value={filters.search}
        onChange={(val) => onFilterChange({ search: val })}
      />

      {/* Right: Desktop dropdowns + Filter Sheet Button */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Event Type Filter */}
        <div className="hidden lg:block w-[140px]">
          <Select
            value={filters.eventType}
            onValueChange={(val: any) => onFilterChange({ eventType: val })}
          >
            <SelectTrigger className="h-10 text-xs rounded-xl border-border bg-card">
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground">
              <SelectItem value="all" className="text-xs">All Event Types</SelectItem>
              <SelectItem value="PUBLIC_RESOLVE" className="text-xs">Public Resolve</SelectItem>
              <SelectItem value="EMERGENCY_TRIGGER" className="text-xs">Emergency Alert</SelectItem>
              <SelectItem value="ADMIN_INSPECT" className="text-xs">Admin Inspection</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Device Category Filter */}
        <div className="hidden xl:block w-[130px]">
          <Select
            value={filters.deviceCategory}
            onValueChange={(val: any) => onFilterChange({ deviceCategory: val })}
          >
            <SelectTrigger className="h-10 text-xs rounded-xl border-border bg-card">
              <SelectValue placeholder="Device" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground">
              <SelectItem value="all" className="text-xs">All Devices</SelectItem>
              <SelectItem value="Mobile" className="text-xs">Mobile</SelectItem>
              <SelectItem value="Desktop" className="text-xs">Desktop</SelectItem>
              <SelectItem value="Tablet" className="text-xs">Tablet</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* More Filters Sheet Trigger (Desktop) */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenFilterSheet}
          className="hidden sm:inline-flex h-10 px-3.5 rounded-xl border-border bg-card hover:bg-muted/60 text-xs font-medium gap-1.5 shadow-xs"
        >
          <VaahanIcon name="filter" size={14} className="text-muted-foreground" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-mono text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* Mobile Filter Drawer Trigger */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenMobileDrawer}
          className="sm:hidden h-10 px-3.5 rounded-xl border-border bg-card hover:bg-muted/60 text-xs font-medium gap-1.5 shadow-xs flex-1"
        >
          <VaahanIcon name="filter" size={14} className="text-muted-foreground" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-mono text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
