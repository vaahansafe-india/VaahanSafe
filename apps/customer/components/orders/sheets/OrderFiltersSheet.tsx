"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@vaahansafe/ui/components";
import type { OrderFilterState, OrderVehicleRef } from "@/lib/orders-types";

interface OrderFiltersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: OrderFilterState;
  vehicles: OrderVehicleRef[];
  onApplyFilters: (newFilters: OrderFilterState) => void;
  onResetFilters: () => void;
}

export function OrderFiltersSheet({
  isOpen,
  onClose,
  filters,
  vehicles,
  onApplyFilters,
  onResetFilters,
}: OrderFiltersSheetProps) {
  const [localFilters, setLocalFilters] = useState<OrderFilterState>(filters);

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    onResetFilters();
    setLocalFilters({ status: "all", search: "", vehicleId: "all", paymentStatus: "all" });
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-background font-sans">
        <SheetHeader className="p-6 border-b border-border/80 bg-card/60">
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
            Filter Parameters
          </div>
          <SheetTitle className="font-serif text-xl font-medium tracking-tight text-foreground">
            Filter Orders &amp; Shipments
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Narrow your hardware orders by fulfillment stage, payment, or vehicle.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 p-6 space-y-5">
          {/* Order Status */}
          <div className="space-y-2">
            <label className="font-mono text-xs font-semibold text-foreground uppercase tracking-wider block">
              Fulfillment Stage
            </label>
            <Select
              value={localFilters.status || "all"}
              onValueChange={(val) => setLocalFilters({ ...localFilters, status: val })}
            >
              <SelectTrigger className="h-10 text-xs font-sans">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Stages</SelectItem>
                <SelectItem value="processing" className="text-xs">Processing / In Preparation</SelectItem>
                <SelectItem value="shipped" className="text-xs">Shipped / In Transit</SelectItem>
                <SelectItem value="delivered" className="text-xs">Delivered</SelectItem>
                <SelectItem value="cancelled" className="text-xs">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Status */}
          <div className="space-y-2">
            <label className="font-mono text-xs font-semibold text-foreground uppercase tracking-wider block">
              Payment State
            </label>
            <Select
              value={localFilters.paymentStatus || "all"}
              onValueChange={(val) => setLocalFilters({ ...localFilters, paymentStatus: val })}
            >
              <SelectTrigger className="h-10 text-xs font-sans">
                <SelectValue placeholder="All Payments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Payments</SelectItem>
                <SelectItem value="paid" className="text-xs">Paid</SelectItem>
                <SelectItem value="pending" className="text-xs">Pending Verification</SelectItem>
                <SelectItem value="failed" className="text-xs">Payment Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Vehicle */}
          {vehicles.length > 0 && (
            <div className="space-y-2">
              <label className="font-mono text-xs font-semibold text-foreground uppercase tracking-wider block">
                Associated Vehicle
              </label>
              <Select
                value={localFilters.vehicleId || "all"}
                onValueChange={(val) => setLocalFilters({ ...localFilters, vehicleId: val })}
              >
                <SelectTrigger className="h-10 text-xs font-sans">
                  <SelectValue placeholder="All Vehicles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Vehicles</SelectItem>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id} className="text-xs font-mono">
                      {v.plateNumber} ({v.makeModel})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-border/80 bg-card/60 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={handleReset} className="font-mono text-xs text-muted-foreground">
            Reset All
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="font-mono text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              className="bg-[#cc785c] hover:bg-[#a9583e] text-white font-mono text-xs"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
