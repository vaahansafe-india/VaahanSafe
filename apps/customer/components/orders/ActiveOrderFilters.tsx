"use client";

import { Badge, Button } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";
import type { OrderFilterState, OrderVehicleRef } from "@/lib/orders-types";

interface ActiveOrderFiltersProps {
  filters: OrderFilterState;
  vehicles: OrderVehicleRef[];
  onRemoveStatus: () => void;
  onRemoveSearch: () => void;
  onRemoveVehicle: () => void;
  onRemovePaymentStatus: () => void;
  onClearAll: () => void;
}

export function ActiveOrderFilters({
  filters,
  vehicles,
  onRemoveStatus,
  onRemoveSearch,
  onRemoveVehicle,
  onRemovePaymentStatus,
  onClearAll,
}: ActiveOrderFiltersProps) {
  const activeChips: Array<{ label: string; onRemove: () => void }> = [];

  if (filters.status && filters.status !== "all") {
    activeChips.push({
      label: `Status: ${filters.status.toUpperCase()}`,
      onRemove: onRemoveStatus,
    });
  }

  if (filters.search) {
    activeChips.push({
      label: `Search: "${filters.search}"`,
      onRemove: onRemoveSearch,
    });
  }

  if (filters.vehicleId && filters.vehicleId !== "all") {
    const v = vehicles.find((item) => item.id === filters.vehicleId);
    activeChips.push({
      label: `Vehicle: ${v ? v.plateNumber : filters.vehicleId}`,
      onRemove: onRemoveVehicle,
    });
  }

  if (filters.paymentStatus && filters.paymentStatus !== "all") {
    activeChips.push({
      label: `Payment: ${filters.paymentStatus.toUpperCase()}`,
      onRemove: onRemovePaymentStatus,
    });
  }

  if (activeChips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        Active Filters:
      </span>

      {activeChips.map((chip, idx) => (
        <Badge
          key={idx}
          variant="secondary"
          className="inline-flex items-center gap-1.5 py-1 pl-2.5 pr-1.5 font-mono text-[11px] bg-muted/80 text-foreground border border-border"
        >
          <span>{chip.label}</span>
          <button
            onClick={chip.onRemove}
            className="rounded-full p-0.5 hover:bg-background/80 hover:text-foreground text-muted-foreground transition-colors"
            aria-label={`Remove ${chip.label} filter`}
          >
            <VaahanIcon name="close" className="size-3" />
          </button>
        </Badge>
      ))}

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-6 px-2 text-[11px] font-mono text-muted-foreground hover:text-foreground"
      >
        Clear all
      </Button>
    </div>
  );
}
