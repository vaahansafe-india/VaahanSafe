"use client";

import { VaahanIcon } from "@vaahansafe/icons";
import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@vaahansafe/ui";
import { PaymentSearch } from "./PaymentSearch";
import type { PaymentFilterState } from "@/lib/payments-types";

interface PaymentFiltersProps {
  filters: PaymentFilterState;
  vehicles: Array<{ id: string; plateNumber: string; label: string }>;
  onFilterChange: (updates: Partial<PaymentFilterState>) => void;
  onOpenFilterSheet: () => void;
  activeFilterCount: number;
}

export function PaymentFilters({
  filters,
  vehicles,
  onFilterChange,
  onOpenFilterSheet,
  activeFilterCount,
}: PaymentFiltersProps) {
  const STATUS_OPTIONS = [
    { value: "all", label: "All Records" },
    { value: "confirmed", label: "Confirmed" },
    { value: "pending", label: "Pending" },
    { value: "failed", label: "Incomplete" },
  ];

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* Search Input */}
      <div className="flex-1 max-w-md">
        <PaymentSearch
          value={filters.search}
          onChange={(search) => onFilterChange({ search })}
        />
      </div>

      {/* Quick Filters Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status Pills */}
        <div className="flex items-center rounded-xl border border-border bg-card p-1 text-xs font-mono">
          {STATUS_OPTIONS.map((opt) => {
            const isActive = filters.status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onFilterChange({ status: opt.value })}
                className={`rounded-lg px-2.5 py-1 transition-colors ${
                  isActive
                    ? "bg-[#cc785c] text-white font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Vehicle Selector (Desktop/Tablet) */}
        {vehicles.length > 0 && (
          <div className="hidden sm:block min-w-[140px]">
            <Select
              value={filters.vehicleId}
              onValueChange={(val) => onFilterChange({ vehicleId: val })}
            >
              <SelectTrigger className="h-9 rounded-xl border-border bg-card px-3 font-mono text-xs text-foreground focus:ring-[#cc785c]">
                <SelectValue placeholder="All Vehicles">
                  {filters.vehicleId === "all"
                    ? "All Vehicles"
                    : (vehicles.find((v) => v.id === filters.vehicleId)?.plateNumber ?? "All Vehicles")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="border-border bg-card font-mono text-xs text-foreground">
                <SelectItem value="all">All Vehicles</SelectItem>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.plateNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* More Filters Trigger */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenFilterSheet}
          className="h-9 gap-1.5 font-mono text-xs border-border bg-card hover:bg-muted"
        >
          <VaahanIcon name="filter" size={13} className="text-[#cc785c]" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex size-4 items-center justify-center rounded-full bg-[#cc785c] text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
