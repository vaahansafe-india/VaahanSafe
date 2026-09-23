"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@vaahansafe/ui";
import type { DashboardFilterState, DashboardVehicle } from "@/lib/dashboard-types";

interface DashboardFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: DashboardVehicle[];
  activeVehicle: DashboardVehicle | null;
  filterState: DashboardFilterState;
}

export function DashboardFilterSheet({
  open,
  onOpenChange,
  vehicles,
  activeVehicle,
  filterState,
}: DashboardFilterSheetProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [selectedRange, setSelectedRange] = React.useState<DashboardFilterState["range"]>(
    filterState.range
  );
  const [selectedType, setSelectedType] = React.useState<string>(
    filterState.eventType || "all"
  );
  const [selectedVehicle, setSelectedVehicle] = React.useState<string>(
    activeVehicle?.id || ""
  );

  React.useEffect(() => {
    setSelectedRange(filterState.range);
    setSelectedType(filterState.eventType || "all");
    setSelectedVehicle(activeVehicle?.id || "");
  }, [filterState, activeVehicle]);

  const handleApply = () => {
    const params = new URLSearchParams(searchParams?.toString() || "");

    if (selectedVehicle) {
      params.set("vehicle", selectedVehicle);
    }
    if (selectedRange === "30d") {
      params.delete("range");
    } else {
      params.set("range", selectedRange);
    }
    if (selectedType === "all") {
      params.delete("type");
    } else {
      params.set("type", selectedType);
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    router.refresh();
    onOpenChange(false);
  };

  const handleReset = () => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("range");
    params.delete("type");
    params.delete("qr");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    router.refresh();
    onOpenChange(false);
  };

  const ranges: Array<{ id: DashboardFilterState["range"]; label: string; desc: string }> = [
    { id: "today", label: "Today", desc: "Since 00:00 midnight" },
    { id: "7d", label: "Last 7 Days", desc: "Weekly temporal window" },
    { id: "30d", label: "Last 30 Days", desc: "Default monthly overview" },
    { id: "all", label: "All Time", desc: "Complete account history" },
  ];

  const types = [
    { id: "all", label: "All Events", desc: "Scans, lifecycles, safety updates" },
    { id: "scan", label: "QR Scans Only", desc: "Public resolutions and checks" },
    { id: "emergency", label: "Emergency Triggers Only", desc: "SOS responder dispatches" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-card p-4 sm:p-6">
        <SheetHeader className="border-b border-border pb-4 pr-12 text-left">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
            ANALYTICS & ACTIVITY FILTER
          </div>
          <SheetTitle className="font-serif text-2xl font-medium text-foreground">
            Filter Telemetry
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Refine Scan Pulse, Activity Constellation, and domain events across vehicles and dates.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Vehicle Selector */}
          <div className="space-y-2">
            <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Vehicle Scope
            </label>
            <div className="space-y-1.5">
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVehicle(v.id)}
                  className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors ${
                    selectedVehicle === v.id
                      ? "border-[#cc785c] bg-[#cc785c]/10 text-foreground font-semibold"
                      : "border-border bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  <div>
                    <div className="font-mono text-xs font-bold">{v.registrationNumber}</div>
                    <div className="text-[10px] text-muted-foreground">{v.make} {v.model}</div>
                  </div>
                  {selectedVehicle === v.id && (
                    <span className="h-2 w-2 rounded-full bg-[#cc785c]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Range Selector */}
          <div className="space-y-2 border-t border-border pt-4">
            <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Time Window
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ranges.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRange(r.id)}
                  className={`rounded-xl border p-2.5 text-left transition-colors ${
                    selectedRange === r.id
                      ? "border-[#cc785c] bg-[#cc785c]/10 text-foreground font-semibold"
                      : "border-border bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  <div className="font-mono text-xs font-bold">{r.label}</div>
                  <div className="text-[10px] text-muted-foreground">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Event Type */}
          <div className="space-y-2 border-t border-border pt-4">
            <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Event Types
            </label>
            <div className="space-y-1.5">
              {types.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedType(t.id)}
                  className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-colors ${
                    selectedType === t.id
                      ? "border-[#cc785c] bg-[#cc785c]/10 text-foreground font-semibold"
                      : "border-border bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  <div>
                    <div className="font-mono text-xs font-bold">{t.label}</div>
                    <div className="text-[10px] text-muted-foreground">{t.desc}</div>
                  </div>
                  {selectedType === t.id && (
                    <span className="h-2 w-2 rounded-full bg-[#cc785c]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="font-mono text-xs text-[#cc785c] hover:underline"
            >
              Reset to Defaults
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="rounded-xl bg-[#cc785c] px-5 py-2 font-mono text-xs font-semibold text-white hover:bg-[#a9583e]"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
