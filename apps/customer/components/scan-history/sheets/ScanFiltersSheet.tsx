"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Button,
  RadioGroup,
  RadioGroupItem,
  Label,
} from "@vaahansafe/ui";
import type {
  ScanHistoryFilterState,
  AuthorizedVehicleScope,
  ScanPeriodFilter,
} from "@/lib/scan-history-types";

interface ScanFiltersSheetProps {
  filters: ScanHistoryFilterState;
  vehicles: AuthorizedVehicleScope[];
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: ScanHistoryFilterState) => void;
  onReset: () => void;
}

export function ScanFiltersSheet({
  filters,
  vehicles,
  isOpen,
  onClose,
  onApply,
  onReset,
}: ScanFiltersSheetProps) {
  const [draft, setDraft] = useState<ScanHistoryFilterState>(filters);

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const handleReset = () => {
    const resetState: ScanHistoryFilterState = {
      period: "30D",
      vehicleId: "all",
      qrPublicId: "all",
      eventType: "all",
      deviceCategory: "all",
      search: "",
    };
    setDraft(resetState);
    onReset();
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[420px] p-0 flex flex-col justify-between border-l border-border bg-card text-card-foreground shadow-2xl"
      >
        <div className="overflow-y-auto p-6 space-y-6">
          <SheetHeader className="text-left space-y-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
              Scan Intelligence
            </div>
            <SheetTitle className="font-serif text-2xl font-medium text-foreground">
              Filter Encounters
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Configure multi-dimensional filters across your verified vehicle passes.
            </SheetDescription>
          </SheetHeader>

          {/* Section 1: Time Horizon */}
          <div className="space-y-3">
            <Label className="font-mono text-[11px] uppercase tracking-wider text-foreground">
              Time Horizon
            </Label>
            <div className="grid grid-cols-5 gap-1.5 p-1 rounded-xl border border-border bg-background">
              {(["24H", "7D", "30D", "90D", "ALL"] as const).map((p) => {
                const isSelected = draft.period === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setDraft({ ...draft, period: p })}
                    className={`py-1.5 text-xs font-mono rounded-lg transition-colors font-medium ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Vehicle Scope */}
          <div className="space-y-3">
            <Label className="font-mono text-[11px] uppercase tracking-wider text-foreground">
              Vehicle Scope
            </Label>
            <RadioGroup
              value={draft.vehicleId}
              onValueChange={(val) => setDraft({ ...draft, vehicleId: val })}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-border bg-background/60">
                <RadioGroupItem value="all" id="scope-all" />
                <Label htmlFor="scope-all" className="text-xs font-medium cursor-pointer flex-1">
                  All Vehicles ({vehicles.length})
                </Label>
              </div>

              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-border bg-background/60"
                >
                  <RadioGroupItem value={v.id} id={`scope-${v.id}`} />
                  <Label htmlFor={`scope-${v.id}`} className="text-xs cursor-pointer flex-1">
                    <span className="font-medium text-foreground block">
                      {v.make} {v.model}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground block">
                      {v.maskedPlate}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Section 3: Event Type */}
          <div className="space-y-3">
            <Label className="font-mono text-[11px] uppercase tracking-wider text-foreground">
              Encounter Type
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: "all", label: "All Events" },
                { val: "PUBLIC_RESOLVE", label: "Public Scans" },
                { val: "EMERGENCY_TRIGGER", label: "Emergency Scans" },
                { val: "ADMIN_INSPECT", label: "Inspections" },
              ].map((item) => {
                const isSelected = draft.eventType === item.val;
                return (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setDraft({ ...draft, eventType: item.val as any })}
                    className={`py-2 px-3 text-xs rounded-xl border text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border bg-background/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Access Context / Device Category */}
          <div className="space-y-3">
            <Label className="font-mono text-[11px] uppercase tracking-wider text-foreground">
              Device Category
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: "all", label: "All Devices" },
                { val: "Mobile", label: "Mobile" },
                { val: "Desktop", label: "Desktop" },
                { val: "Tablet", label: "Tablet" },
              ].map((item) => {
                const isSelected = draft.deviceCategory === item.val;
                return (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setDraft({ ...draft, deviceCategory: item.val as any })}
                    className={`py-2 px-3 text-xs rounded-xl border text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border bg-background/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="p-6 border-t border-border/70 bg-card flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="flex-1 h-11 rounded-xl text-xs font-semibold"
          >
            Reset
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-xs"
          >
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
