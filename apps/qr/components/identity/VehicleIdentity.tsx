import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components";
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
    <div className="w-full p-4 rounded-xl bg-card border border-border/80 shadow-xs space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <VaahanIcon name={iconName} size={16} />
          <span className="font-mono text-[10px] uppercase tracking-wider">
            Vehicle Identity
          </span>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground px-2 py-0.5">
          {typeLabel}
        </Badge>
      </div>

      <div className="text-base font-serif font-medium text-foreground tracking-tight">
        {vehicleDisplay}
      </div>
    </div>
  );
}
