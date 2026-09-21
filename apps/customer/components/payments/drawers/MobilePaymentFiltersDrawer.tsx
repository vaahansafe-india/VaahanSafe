"use client";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@vaahansafe/ui";
import type { PaymentFilterState } from "@/lib/payments-types";

interface MobilePaymentFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: PaymentFilterState;
  onApplyFilters: (updates: Partial<PaymentFilterState>) => void;
  onResetFilters: () => void;
  vehicles: Array<{ id: string; plateNumber: string; label: string }>;
}

export function MobilePaymentFiltersDrawer({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters,
  vehicles,
}: MobilePaymentFiltersDrawerProps) {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-card font-sans">
        <DrawerHeader className="text-left border-b border-border pb-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
            Filter Parameters
          </div>
          <DrawerTitle className="font-serif text-xl font-medium text-foreground">
            Filter Payments
          </DrawerTitle>
          <DrawerDescription className="text-xs text-muted-foreground">
            Refine records by status, vehicle, and purpose.
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 space-y-5 text-xs font-mono max-h-[60vh] overflow-y-auto">
          {/* Status Pills */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase text-muted-foreground block">
              Payment Status
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "all", label: "All Statuses" },
                { id: "confirmed", label: "Confirmed" },
                { id: "pending", label: "Pending" },
                { id: "failed", label: "Incomplete" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onApplyFilters({ status: opt.id })}
                  className={`rounded-xl border p-2.5 text-center transition-colors ${
                    filters.status === opt.id
                      ? "border-[#cc785c] bg-[#cc785c]/10 text-foreground font-semibold"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Purpose */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase text-muted-foreground block">
              Payment Purpose
            </span>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: "all", label: "All Categories" },
                { id: "QR_PURCHASE", label: "QR Safety Kit" },
                { id: "SUBSCRIPTION", label: "Service Plan" },
                { id: "REPLACEMENT", label: "Replacement Hardware" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onApplyFilters({ purpose: opt.id })}
                  className={`rounded-xl border p-2 text-left transition-colors ${
                    filters.purpose === opt.id
                      ? "border-[#cc785c] bg-[#cc785c]/10 text-foreground font-semibold"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Select */}
          {vehicles.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase text-muted-foreground block">
                Associated Vehicle
              </span>
              <Select
                value={filters.vehicleId}
                onValueChange={(val) => onApplyFilters({ vehicleId: val })}
              >
                <SelectTrigger className="w-full h-10 rounded-xl border-border bg-background px-3 font-mono text-xs text-foreground focus:ring-[#cc785c]">
                  <SelectValue placeholder="All Vehicles">
                    {filters.vehicleId === "all"
                      ? "All Vehicles"
                      : (vehicles.find((v) => v.id === filters.vehicleId)?.label ?? "All Vehicles")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="border-border bg-card font-mono text-xs text-foreground">
                  <SelectItem value="all">All Vehicles</SelectItem>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DrawerFooter className="border-t border-border pt-3 flex flex-row items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="w-1/2 font-mono text-xs"
          >
            Reset
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onClose}
            className="w-1/2 bg-[#cc785c] hover:bg-[#a9583e] text-white font-mono text-xs"
          >
            Apply
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
