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
import type { DashboardVehicle } from "@/lib/dashboard-types";

interface VehicleContextSelectorProps {
  vehicles: DashboardVehicle[];
  activeVehicle: DashboardVehicle | null;
}

export function VehicleContextSelector({
  vehicles,
  activeVehicle,
}: VehicleContextSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

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

  const handleSelect = (vehicleId: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("vehicle", vehicleId);
    router.push(`/dashboard?${params.toString()}`);
    setOpen(false);
  };

  if (!activeVehicle) {
    return (
      <div className="flex h-10 w-full sm:w-auto items-center gap-2 rounded-xl border border-dashed border-border px-3 font-mono text-xs text-muted-foreground">
        <VaahanIcon name="vehicle" size={14} />
        <span>No vehicle registered</span>
      </div>
    );
  }

  const triggerButton = (
    <button
      type="button"
      aria-expanded={open}
      onClick={() => setOpen(true)}
      className="group flex h-10 w-full sm:w-auto items-center justify-between sm:justify-start gap-2 sm:gap-2.5 rounded-xl border border-border bg-card px-2.5 sm:px-3 text-left shadow-2xs transition-all hover:border-[#cc785c]/40 hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-[#cc785c]/30 min-w-0"
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#cc785c]/10 text-[#cc785c] transition-colors group-hover:bg-[#cc785c] group-hover:text-white">
        <VaahanIcon name="vehicle" size={13} />
      </div>
      <div className="min-w-0 flex-1 leading-none">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-bold tracking-wider text-foreground leading-none truncate max-w-[140px] sm:max-w-none">
            {activeVehicle.registrationNumber}
          </span>
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#5db8a6]" />
        </div>
        <div className="mt-1 truncate text-[10px] text-muted-foreground leading-none">
          {activeVehicle.make} {activeVehicle.model}
        </div>
      </div>
      <VaahanIcon
        name="chevron-down"
        size={13}
        className={`shrink-0 ml-auto sm:ml-1 text-muted-foreground transition-transform duration-200 ${
          open ? "rotate-180" : ""
        }`}
      />
    </button>
  );

  const selectorContent = (
    <>
      <div className="border-b border-border p-3.5 sm:p-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Switch Vehicle Context
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
        </div>
      </div>

      <div className="max-h-60 overflow-y-auto p-1.5">
        <div className="px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Registered Vehicles ({vehicles.length})
        </div>
        {filteredVehicles.map((v) => {
          const isSelected = v.id === activeVehicle.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => handleSelect(v.id)}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                isSelected
                  ? "bg-[#cc785c]/10 text-foreground font-medium"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                    isSelected
                      ? "bg-[#cc785c] text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <VaahanIcon name="vehicle" size={13} />
                </span>
                <div className="min-w-0">
                  <div className="font-mono font-medium tracking-wide truncate">
                    {v.registrationNumber}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {v.make} {v.model} &bull; {v.type}
                  </div>
                </div>
              </div>
              {isSelected && (
                <span className="font-mono text-[10px] text-[#cc785c] shrink-0 ml-2">ACTIVE</span>
              )}
            </button>
          );
        })}
        {filteredVehicles.length === 0 && (
          <div className="p-4 text-center text-xs text-muted-foreground font-mono">
            No vehicles match &ldquo;{search}&rdquo;
          </div>
        )}
      </div>

      <div className="border-t border-border p-2">
        <button
          type="button"
          onClick={() => router.push("/vehicles/new")}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-[#cc785c] hover:bg-[#cc785c]/5"
        >
          <VaahanIcon name="arrow-right" size={13} />
          <span>+ Add New Vehicle</span>
        </button>
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
              <DialogTitle>Switch Vehicle Context</DialogTitle>
              <DialogDescription>Select active vehicle</DialogDescription>
            </DialogHeader>
            {selectorContent}
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
        {selectorContent}
      </PopoverContent>
    </Popover>
  );
}
