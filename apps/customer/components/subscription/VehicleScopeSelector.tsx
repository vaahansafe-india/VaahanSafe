"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@vaahansafe/ui";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ConnectedVehicleServiceItem } from "@/lib/subscription-types";

interface VehicleScopeSelectorProps {
  vehicles: ConnectedVehicleServiceItem[];
  scopedVehicleId?: string;
}

export function VehicleScopeSelector({ vehicles, scopedVehicleId }: VehicleScopeSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const activeVehicle = scopedVehicleId
    ? vehicles.find((v) => v.id === scopedVehicleId) || null
    : null;

  const filteredVehicles = React.useMemo(() => {
    if (!search.trim()) return vehicles;
    const q = search.toLowerCase();
    return vehicles.filter(
      (v) =>
        v.registrationNumber.toLowerCase().includes(q) ||
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q)
    );
  }, [vehicles, search]);

  const handleSelect = (vehicleId: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (vehicleId) {
      params.set("vehicle", vehicleId);
    } else {
      params.delete("vehicle");
    }
    router.push(`/subscription?${params.toString()}`);
    setOpen(false);
  };

  if (vehicles.length === 0) {
    return (
      <div className="flex h-10 w-full sm:w-auto items-center gap-2 rounded-xl border border-dashed border-border px-3 font-mono text-xs text-muted-foreground">
        <VaahanIcon name="vehicle" size={13} />
        <span>No vehicles registered</span>
      </div>
    );
  }

  const triggerButton = (
    <button
      type="button"
      aria-expanded={open}
      onClick={() => setOpen(true)}
      className="group flex h-10 w-full sm:w-auto items-center justify-between sm:justify-start gap-2.5 rounded-xl border border-border bg-card px-3 text-left shadow-2xs transition-all hover:border-[#cc785c]/40 hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-[#cc785c]/30 active:scale-[0.98]"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#cc785c]/10 text-[#cc785c] transition-colors group-hover:bg-[#cc785c] group-hover:text-white">
          <VaahanIcon name="vehicle" size={13} />
        </div>
        <div className="leading-tight min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold tracking-wider text-foreground truncate max-w-[140px] sm:max-w-none">
              {activeVehicle ? activeVehicle.registrationNumber : "All Vehicle Identities"}
            </span>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#5db8a6]" />
          </div>
          <div className="truncate text-[10px] text-muted-foreground font-mono">
            {activeVehicle ? `${activeVehicle.make} ${activeVehicle.model}` : `${vehicles.length} Connected`}
          </div>
        </div>
      </div>
      <VaahanIcon
        name="chevron-down"
        size={12}
        className={`shrink-0 ml-1.5 text-muted-foreground transition-transform duration-200 ${
          open ? "rotate-180" : ""
        }`}
      />
    </button>
  );

  const scopeListContent = (
    <>
      <div className="border-b border-border p-3.5 sm:p-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Filter Service Scope
        </div>
        <div className="mt-2.5 sm:mt-2 flex items-center gap-2 rounded-xl sm:rounded-lg border border-border bg-background px-3 py-2 sm:px-2.5 sm:py-1.5 text-xs text-foreground focus-within:border-[#cc785c]">
          <VaahanIcon name="search" size={13} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search registration or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-[10px] font-mono text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="max-h-72 sm:max-h-60 overflow-y-auto p-2 sm:p-1.5 space-y-1">
        <button
          type="button"
          onClick={() => handleSelect(null)}
          className={`w-full flex items-center justify-between rounded-xl sm:rounded-lg px-3 py-2.5 sm:px-2.5 sm:py-2 text-left transition-colors ${
            !activeVehicle ? "bg-[#cc785c]/10 text-[#cc785c]" : "hover:bg-muted/60"
          }`}
        >
          <div>
            <div className="font-mono text-xs font-bold">All Vehicle Identities</div>
            <div className="text-[10px] text-muted-foreground">Global service overview</div>
          </div>
          {!activeVehicle && <VaahanIcon name="check" size={14} className="text-[#cc785c]" />}
        </button>

        <div className="px-2 pt-2 sm:pt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Individual Vehicles ({vehicles.length})
        </div>

        {filteredVehicles.map((v) => {
          const isSelected = activeVehicle?.id === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => handleSelect(v.id)}
              className={`w-full flex items-center justify-between rounded-xl sm:rounded-lg px-3 py-2.5 sm:px-2.5 sm:py-2 text-left transition-colors ${
                isSelected ? "bg-[#cc785c]/10 text-[#cc785c]" : "hover:bg-muted/60"
              }`}
            >
              <div>
                <div className="font-mono text-xs font-bold">{v.registrationNumber}</div>
                <div className="text-[10px] text-muted-foreground">
                  {v.make} {v.model} &bull; {v.qr ? v.qr.visibleCode : "No QR"}
                </div>
              </div>
              {isSelected && <VaahanIcon name="check" size={14} className="text-[#cc785c]" />}
            </button>
          );
        })}

        {filteredVehicles.length === 0 && (
          <div className="p-4 text-center text-xs text-muted-foreground font-mono">
            No vehicles match &ldquo;{search}&rdquo;
          </div>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        {triggerButton}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="w-full bg-card p-0 border-border overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle>Filter Service Scope</DialogTitle>
              <DialogDescription>Select active vehicle scope</DialogDescription>
            </DialogHeader>
            {scopeListContent}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {triggerButton}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-80 p-0 shadow-xl border-border rounded-xl overflow-hidden"
      >
        {scopeListContent}
      </PopoverContent>
    </Popover>
  );
}
