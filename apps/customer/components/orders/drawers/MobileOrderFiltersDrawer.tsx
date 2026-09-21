"use client";

import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@vaahansafe/ui/components";
import type { OrderFilterState, OrderVehicleRef } from "@/lib/orders-types";

interface MobileOrderFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: OrderFilterState;
  vehicles: OrderVehicleRef[];
  onApplyFilters: (newFilters: OrderFilterState) => void;
  onResetFilters: () => void;
}

export function MobileOrderFiltersDrawer({
  isOpen,
  onClose,
  filters,
  vehicles,
  onApplyFilters,
  onResetFilters,
}: MobileOrderFiltersDrawerProps) {
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
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-background max-h-[85vh] font-sans">
        <DrawerHeader className="text-left border-b border-border/60 pb-3">
          <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#cc785c]">
            Mobile Filters
          </div>
          <DrawerTitle className="font-serif text-lg font-medium text-foreground">
            Filter Orders
          </DrawerTitle>
          <DrawerDescription className="text-xs text-muted-foreground">
            Select criteria to filter your physical orders.
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Order Status */}
          <div className="space-y-1.5">
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
          <div className="space-y-1.5">
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
            <div className="space-y-1.5">
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

        <DrawerFooter className="border-t border-border/60 pt-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex-1 font-mono text-xs"
            >
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              className="flex-1 bg-[#cc785c] hover:bg-[#a9583e] text-white font-mono text-xs"
            >
              Apply Filters
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
