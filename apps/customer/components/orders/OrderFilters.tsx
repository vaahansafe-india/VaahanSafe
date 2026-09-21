"use client";

import { Input, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";
import type { OrderFilterState, OrderVehicleRef } from "@/lib/orders-types";
import { ActiveOrderFilters } from "./ActiveOrderFilters";

interface OrderFiltersProps {
  filters: OrderFilterState;
  vehicles: OrderVehicleRef[];
  onFilterChange: (newFilters: Partial<OrderFilterState>) => void;
  onClearFilters: () => void;
  onOpenFiltersSheet: () => void;
  activeFilterCount: number;
}

export function OrderFilters({
  filters,
  vehicles,
  onFilterChange,
  onClearFilters,
  onOpenFiltersSheet,
  activeFilterCount,
}: OrderFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Search & Quick Controls Bar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <VaahanIcon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
          />
          <Input
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="Search orders, vehicles, tracking..."
            className="h-10 pl-9 pr-9 font-sans text-xs bg-background border-border focus-visible:ring-[#cc785c]"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              aria-label="Clear search"
            >
              <VaahanIcon name="close" className="size-3.5" />
            </button>
          )}
        </div>

        {/* Quick Filter: Vehicle (Desktop/Tablet) */}
        {vehicles.length > 0 && (
          <div className="hidden md:block w-44 lg:w-48 shrink-0">
            <Select
              value={filters.vehicleId || "all"}
              onValueChange={(val) => onFilterChange({ vehicleId: val })}
            >
              <SelectTrigger className="h-10 text-xs font-sans bg-background border-border">
                <SelectValue placeholder="All Vehicles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Vehicles</SelectItem>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id} className="text-xs font-mono">
                    {v.plateNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Quick Filter: Payment Status (Desktop/Tablet) */}
        <div className="hidden lg:block w-36 shrink-0">
          <Select
            value={filters.paymentStatus || "all"}
            onValueChange={(val) => onFilterChange({ paymentStatus: val })}
          >
            <SelectTrigger className="h-10 text-xs font-sans bg-background border-border">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Payments</SelectItem>
              <SelectItem value="paid" className="text-xs">Paid</SelectItem>
              <SelectItem value="pending" className="text-xs">Pending</SelectItem>
              <SelectItem value="failed" className="text-xs">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* "More Filters" Button (Sheet on Desktop, Drawer on Mobile) */}
        <Button
          onClick={onOpenFiltersSheet}
          variant="outline"
          className="h-10 gap-1.5 px-3 font-mono text-xs border-border hover:bg-muted shrink-0"
        >
          <VaahanIcon name="filter" className="size-3.5 text-muted-foreground" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex size-4 items-center justify-center rounded-full bg-[#cc785c] text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Active Filter Chips */}
      <ActiveOrderFilters
        filters={filters}
        vehicles={vehicles}
        onRemoveStatus={() => onFilterChange({ status: "all" })}
        onRemoveSearch={() => onFilterChange({ search: "" })}
        onRemoveVehicle={() => onFilterChange({ vehicleId: "all" })}
        onRemovePaymentStatus={() => onFilterChange({ paymentStatus: "all" })}
        onClearAll={onClearFilters}
      />
    </div>
  );
}
