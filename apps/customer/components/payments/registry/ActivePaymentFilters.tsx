"use client";

import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui";
import type { PaymentFilterState } from "@/lib/payments-types";

interface ActivePaymentFiltersProps {
  filters: PaymentFilterState;
  vehicleLabel?: string;
  onRemoveFilter: (key: keyof PaymentFilterState) => void;
  onClearAll: () => void;
}

export function ActivePaymentFilters({
  filters,
  vehicleLabel,
  onRemoveFilter,
  onClearAll,
}: ActivePaymentFiltersProps) {
  const hasActiveFilters =
    filters.status !== "all" ||
    filters.vehicleId !== "all" ||
    filters.purpose !== "all" ||
    Boolean(filters.search);

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
      <span className="text-[11px] uppercase text-muted-foreground mr-1">Active Filters:</span>

      {filters.status !== "all" && (
        <Badge
          variant="secondary"
          className="gap-1 border border-border bg-card px-2 py-0.5 text-[11px] font-mono capitalize"
        >
          <span>Status: {filters.status}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter("status")}
            className="hover:text-[#cc785c] ml-1"
          >
            <VaahanIcon name="close" size={10} />
          </button>
        </Badge>
      )}

      {filters.vehicleId !== "all" && (
        <Badge
          variant="secondary"
          className="gap-1 border border-border bg-card px-2 py-0.5 text-[11px] font-mono"
        >
          <span>Vehicle: {vehicleLabel || filters.vehicleId}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter("vehicleId")}
            className="hover:text-[#cc785c] ml-1"
          >
            <VaahanIcon name="close" size={10} />
          </button>
        </Badge>
      )}

      {filters.purpose !== "all" && (
        <Badge
          variant="secondary"
          className="gap-1 border border-border bg-card px-2 py-0.5 text-[11px] font-mono capitalize"
        >
          <span>Purpose: {filters.purpose.replace("_", " ")}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter("purpose")}
            className="hover:text-[#cc785c] ml-1"
          >
            <VaahanIcon name="close" size={10} />
          </button>
        </Badge>
      )}

      {filters.search && (
        <Badge
          variant="secondary"
          className="gap-1 border border-border bg-card px-2 py-0.5 text-[11px] font-mono"
        >
          <span>Query: &ldquo;{filters.search}&rdquo;</span>
          <button
            type="button"
            onClick={() => onRemoveFilter("search")}
            className="hover:text-[#cc785c] ml-1"
          >
            <VaahanIcon name="close" size={10} />
          </button>
        </Badge>
      )}

      <button
        type="button"
        onClick={onClearAll}
        className="text-[11px] text-[#cc785c] hover:underline ml-2"
      >
        Clear all
      </button>
    </div>
  );
}
