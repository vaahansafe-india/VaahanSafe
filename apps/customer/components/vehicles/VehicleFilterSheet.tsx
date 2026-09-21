"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  Button,
  Checkbox,
  Label,
} from "@vaahansafe/ui";
import type { VehicleFilterState, VehicleCategory } from "@/lib/vehicle-types";

interface VehicleFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: VehicleFilterState;
  onApplyFilters: (filters: VehicleFilterState) => void;
  totalMatches?: number;
}

export function VehicleFilterSheet({
  open,
  onOpenChange,
  filters,
  onApplyFilters,
  totalMatches,
}: VehicleFilterSheetProps) {
  const [selectedTypes, setSelectedTypes] = React.useState<VehicleCategory[]>(
    filters.types || []
  );
  const [qrStatus, setQrStatus] = React.useState<"ALL" | "ACTIVE" | "UNLINKED">(
    filters.qrStatus || "ALL"
  );
  const [safetyStatus, setSafetyStatus] = React.useState<
    "ALL" | "CONFIGURED" | "NEEDS_SETUP"
  >(filters.safetyStatus || "ALL");

  React.useEffect(() => {
    setSelectedTypes(filters.types || []);
    setQrStatus(filters.qrStatus || "ALL");
    setSafetyStatus(filters.safetyStatus || "ALL");
  }, [filters, open]);

  const handleToggleType = (type: VehicleCategory) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleReset = () => {
    setSelectedTypes([]);
    setQrStatus("ALL");
    setSafetyStatus("ALL");
    onApplyFilters({
      ...filters,
      types: [],
      qrStatus: "ALL",
      safetyStatus: "ALL",
    });
    onOpenChange(false);
  };

  const handleApply = () => {
    onApplyFilters({
      ...filters,
      types: selectedTypes,
      qrStatus,
      safetyStatus,
    });
    onOpenChange(false);
  };

  const activeCount =
    (selectedTypes.length > 0 ? 1 : 0) +
    (qrStatus !== "ALL" ? 1 : 0) +
    (safetyStatus !== "ALL" ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-card p-6 border-l border-border">
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
              REGISTRY FILTERS
            </div>
            {activeCount > 0 && (
              <span className="rounded-full bg-[#cc785c]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#cc785c]">
                {activeCount} Active
              </span>
            )}
          </div>
          <SheetTitle className="font-serif text-2xl font-medium text-foreground">
            Filter Vehicles
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Refine your vehicle registry by asset category, QR lifeline status, or safety setup.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Vehicle Category */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Vehicle Type
            </h4>
            <div className="space-y-2">
              {[
                { id: "CAR", label: "Car / SUV / Sedan" },
                { id: "MOTORCYCLE", label: "Motorcycle" },
                { id: "SCOOTER", label: "Scooter" },
                { id: "COMMERCIAL", label: "Commercial Transport" },
                { id: "OTHER", label: "Other" },
              ].map((item) => {
                const isChecked = selectedTypes.includes(item.id as VehicleCategory);
                return (
                  <div key={item.id} className="flex items-center space-x-2.5">
                    <Checkbox
                      id={`type-${item.id}`}
                      checked={isChecked}
                      onCheckedChange={() => handleToggleType(item.id as VehicleCategory)}
                    />
                    <Label
                      htmlFor={`type-${item.id}`}
                      className="text-xs font-medium text-foreground cursor-pointer"
                    >
                      {item.label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* QR Lifeline State */}
          <div className="space-y-3 border-t border-border pt-4">
            <h4 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              QR Lifeline Status
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "ALL", label: "All" },
                { id: "ACTIVE", label: "Active" },
                { id: "UNLINKED", label: "Unlinked" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setQrStatus(item.id as any)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                    qrStatus === item.id
                      ? "border-[#cc785c] bg-[#cc785c]/10 text-[#cc785c] font-semibold"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Safety View State */}
          <div className="space-y-3 border-t border-border pt-4">
            <h4 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Safety View Setup
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "ALL", label: "All" },
                { id: "CONFIGURED", label: "Configured" },
                { id: "NEEDS_SETUP", label: "Needs Setup" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSafetyStatus(item.id as any)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                    safetyStatus === item.id
                      ? "border-[#cc785c] bg-[#cc785c]/10 text-[#cc785c] font-semibold"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter className="mt-8 pt-4 border-t border-border flex sm:justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="w-1/2 font-mono text-xs uppercase tracking-wider"
          >
            Reset
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            className="w-1/2 bg-[#cc785c] hover:bg-[#a9583e] text-white font-mono text-xs uppercase tracking-wider"
          >
            {totalMatches !== undefined ? `Show (${totalMatches})` : "Apply"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
