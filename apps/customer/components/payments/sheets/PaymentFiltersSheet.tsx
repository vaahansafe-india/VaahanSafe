"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@vaahansafe/ui";
import { VaahanIcon } from "@vaahansafe/icons";
import type { PaymentFilterState } from "@/lib/payments-types";

interface PaymentFiltersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: PaymentFilterState;
  onApplyFilters: (updates: Partial<PaymentFilterState>) => void;
  onResetFilters: () => void;
  vehicles: Array<{ id: string; plateNumber: string; label: string }>;
}

export function PaymentFiltersSheet({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters,
  vehicles,
}: PaymentFiltersSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-card p-4 sm:p-6 space-y-6">
        <SheetHeader className="border-b border-border pb-4 pr-12 text-left">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
            Filter Parameters
          </div>
          <SheetTitle className="font-serif text-2xl font-medium text-foreground">
            Filter Payments
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Narrow down financial records by status, vehicle, and purpose.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 text-xs font-mono">
          {/* 1. PAYMENT STATUS */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
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
                  className={`rounded-xl border p-2.5 text-left transition-colors ${
                    filters.status === opt.id
                      ? "border-[#cc785c] bg-[#cc785c]/10 text-foreground font-semibold"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. PURPOSE / CATEGORY */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
              Payment Purpose
            </span>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: "all", label: "All Categories" },
                { id: "QR_PURCHASE", label: "QR Safety Kit Purchase" },
                { id: "SUBSCRIPTION", label: "Service Plan Subscription" },
                { id: "REPLACEMENT", label: "Replacement Hardware" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onApplyFilters({ purpose: opt.id })}
                  className={`rounded-xl border p-2.5 text-left transition-colors ${
                    filters.purpose === opt.id
                      ? "border-[#cc785c] bg-[#cc785c]/10 text-foreground font-semibold"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. VEHICLE SCOPE */}
          {vehicles.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                Associated Vehicle
              </span>
              <Select
                value={filters.vehicleId}
                onValueChange={(val) => onApplyFilters({ vehicleId: val })}
              >
                <SelectTrigger className="w-full h-10 rounded-xl border-border bg-background px-3 font-mono text-xs text-foreground focus:ring-[#cc785c]">
                  <SelectValue placeholder="All Connected Vehicles">
                    {filters.vehicleId === "all"
                      ? "All Connected Vehicles"
                      : (vehicles.find((v) => v.id === filters.vehicleId)?.label ?? "All Connected Vehicles")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="border-border bg-card font-mono text-xs text-foreground">
                  <SelectItem value="all">All Connected Vehicles</SelectItem>
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

        {/* BOTTOM ACTIONS */}
        <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="font-mono text-xs"
          >
            Reset Filters
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onClose}
            className="bg-[#cc785c] hover:bg-[#a9583e] text-white font-mono text-xs"
          >
            Apply &amp; Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
