import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components/badge";
import type { VehicleType } from "@vaahansafe/types";

export interface VehicleIdentityProps {
  vehicleDisplay: string;
  vehicleType: VehicleType | string;
}

export function VehicleIdentity({ vehicleDisplay, vehicleType }: VehicleIdentityProps) {
  const iconName =
    vehicleType === "MOTORCYCLE" || vehicleType === "SCOOTER"
      ? "motorcycle"
      : vehicleType === "COMMERCIAL"
        ? "truck"
        : "car";

  const typeLabel =
    vehicleType === "CAR"
      ? "Passenger Car"
      : vehicleType === "MOTORCYCLE"
        ? "Two-Wheeler"
        : vehicleType === "SCOOTER"
          ? "Scooter"
          : vehicleType === "COMMERCIAL"
            ? "Commercial Fleet"
            : "Registered Vehicle";

  return (
    <div className="w-full space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <VaahanIcon name={iconName} size={16} />
          <span className="font-mono text-[10px] uppercase tracking-wider">
            This vehicle
          </span>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground px-2 py-0.5">
          {typeLabel}
        </Badge>
      </div>

      <div className="break-words font-serif text-2xl font-medium leading-tight text-foreground sm:text-3xl">
        {vehicleDisplay}
      </div>
    </div>
  );
}
