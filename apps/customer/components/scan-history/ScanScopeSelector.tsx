"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Button,
} from "@vaahansafe/ui";
import { VaahanIcon } from "@vaahansafe/icons";
import type { AuthorizedVehicleScope } from "@/lib/scan-history-types";

interface ScanScopeSelectorProps {
  vehicles: AuthorizedVehicleScope[];
  selectedVehicleId: string;
  onSelectVehicle: (vehicleId: string) => void;
}

export function ScanScopeSelector({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
}: ScanScopeSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const triggerLabel = selectedVehicle
    ? `${selectedVehicle.make} ${selectedVehicle.model}`
    : "All QR Identities";

  const triggerSub = selectedVehicle
    ? selectedVehicle.maskedPlate
    : `${vehicles.length} ${vehicles.length === 1 ? "vehicle" : "vehicles"}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-10 sm:h-11 px-3 sm:px-4 justify-between gap-2.5 rounded-xl border-border bg-card hover:bg-muted/60 text-left w-full md:w-auto min-w-0 md:min-w-[210px] shadow-xs"
        >
          <div className="flex items-center gap-2 truncate">
            <VaahanIcon name="qr-code" size={16} className="text-primary shrink-0" />
            <div className="flex flex-col text-left truncate">
              <span className="font-semibold text-xs text-foreground truncate">
                {triggerLabel}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground truncate">
                {triggerSub}
              </span>
            </div>
          </div>
          <VaahanIcon name="chevron-down" size={14} className="text-muted-foreground shrink-0" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[280px] max-w-sm p-0 rounded-xl border-border bg-popover text-popover-foreground shadow-xl" align="end">
        <Command>
          <CommandInput placeholder="Search authorized pass..." className="h-9 font-sans text-xs" />
          <CommandList className="max-h-[260px] p-1">
            <CommandEmpty className="py-4 text-center text-xs text-muted-foreground font-mono">
              No matching pass found.
            </CommandEmpty>

            <CommandGroup heading="Scope Selection">
              {/* All Passes Option */}
              <CommandItem
                value="all All QR Identities"
                onSelect={() => {
                  onSelectVehicle("all");
                  setOpen(false);
                }}
                className="flex items-center justify-between py-2 px-2.5 rounded-lg text-xs cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-primary" />
                  <span className="font-semibold text-foreground">All QR Identities</span>
                </div>
                {selectedVehicleId === "all" && (
                  <VaahanIcon name="check" size={14} className="text-primary" />
                )}
              </CommandItem>

              {/* Per Vehicle / QR Option */}
              {vehicles.map((v) => {
                const isSelected = selectedVehicleId === v.id;
                return (
                  <CommandItem
                    key={v.id}
                    value={`${v.id} ${v.make} ${v.model} ${v.plate}`}
                    onSelect={() => {
                      onSelectVehicle(v.id);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between py-2 px-2.5 rounded-lg text-xs cursor-pointer"
                  >
                    <div className="space-y-0.5 truncate">
                      <div className="font-medium text-foreground truncate">
                        {v.make} {v.model}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {v.maskedPlate}
                        {v.qrPublicId && ` • ${v.qrPublicId}`}
                      </div>
                    </div>
                    {isSelected && (
                      <VaahanIcon name="check" size={14} className="text-primary shrink-0 ml-2" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
