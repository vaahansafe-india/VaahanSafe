"use client";

import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  Button,
  RadioGroup,
  RadioGroupItem,
  Label,
} from "@vaahansafe/ui";
import type {
  ScanHistoryFilterState,
  AuthorizedVehicleScope,
} from "@/lib/scan-history-types";

interface MobileScanFiltersDrawerProps {
  filters: ScanHistoryFilterState;
  vehicles: AuthorizedVehicleScope[];
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: ScanHistoryFilterState) => void;
  onReset: () => void;
}

export function MobileScanFiltersDrawer({
  filters,
  vehicles,
  isOpen,
  onClose,
  onApply,
  onReset,
}: MobileScanFiltersDrawerProps) {
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
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85vh] p-0 flex flex-col justify-between border-t border-border bg-card text-card-foreground">
        <DrawerHeader className="text-left px-5 pt-4 pb-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            Filter Encounters
          </div>
          <DrawerTitle className="font-serif text-xl font-medium text-foreground">
            Encounter Horizons
          </DrawerTitle>
          <DrawerDescription className="text-xs text-muted-foreground">
            Adjust time periods and vehicle scopes.
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-5 py-3 space-y-5 text-xs">
          {/* Period Selector */}
          <div className="space-y-2">
            <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Period
            </Label>
            <div className="grid grid-cols-5 gap-1 p-1 rounded-xl border border-border bg-background">
              {(["24H", "7D", "30D", "90D", "ALL"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setDraft({ ...draft, period: p })}
                  className={`py-1.5 text-xs font-mono rounded-lg transition-colors font-medium ${
                    draft.period === p
                      ? "bg-primary text-primary-foreground font-bold"
                      : "text-muted-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Selector */}
          <div className="space-y-2">
            <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Vehicle Scope
            </Label>
            <RadioGroup
              value={draft.vehicleId}
              onValueChange={(val) => setDraft({ ...draft, vehicleId: val })}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-border bg-background/60">
                <RadioGroupItem value="all" id="m-scope-all" />
                <Label htmlFor="m-scope-all" className="text-xs font-medium cursor-pointer flex-1">
                  All Vehicles ({vehicles.length})
                </Label>
              </div>

              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-border bg-background/60"
                >
                  <RadioGroupItem value={v.id} id={`m-scope-${v.id}`} />
                  <Label htmlFor={`m-scope-${v.id}`} className="text-xs cursor-pointer flex-1 truncate">
                    <span className="font-medium text-foreground block truncate">
                      {v.make} {v.model}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground block truncate">
                      {v.maskedPlate}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Encounter Type
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: "all", label: "All Events" },
                { val: "PUBLIC_RESOLVE", label: "Public Scans" },
                { val: "EMERGENCY_TRIGGER", label: "Emergency Scans" },
                { val: "ADMIN_INSPECT", label: "Inspections" },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setDraft({ ...draft, eventType: item.val as any })}
                  className={`py-2 px-2.5 text-xs rounded-xl border text-left transition-colors ${
                    draft.eventType === item.val
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border bg-background/60 text-muted-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DrawerFooter className="p-5 border-t border-border/70 flex flex-row items-center gap-2.5">
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
            className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs"
          >
            Apply Filters
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
