"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui";
import type { ConnectedVehicleServiceItem } from "@/lib/subscription-types";

interface ConnectedVehicleRowProps {
  vehicle: ConnectedVehicleServiceItem;
  index: number;
  isSelected?: boolean;
  onSelect: () => void;
  onInspect: () => void;
}

export function ConnectedVehicleRow({
  vehicle,
  index,
  isSelected,
  onSelect,
  onInspect,
}: ConnectedVehicleRowProps) {
  const isQrActive = vehicle.qr?.status === "ACTIVATED";
  const isSubActive = vehicle.subscriptionStatus === "ACTIVE";
  const isBaseline = vehicle.subscriptionStatus === "BASELINE_ONLY";

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border transition-all ${
        isSelected
          ? "border-[#cc785c]/50 bg-[#cc785c]/[0.03] shadow-xs"
          : "border-border bg-card hover:border-border/80"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-mono text-xs font-bold text-muted-foreground w-5 shrink-0">
          0{index + 1}
        </span>

        <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-[#cc785c]">
          <VaahanIcon name="vehicle" size={17} />
        </div>

        <div className="space-y-0.5 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-foreground">
              {vehicle.registrationNumber}
            </span>
            <span className="text-[11px] sm:text-xs text-muted-foreground truncate">
              {vehicle.make} {vehicle.model}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs font-mono text-muted-foreground">
            <span>Identity:</span>
            <span className="font-bold text-foreground truncate">
              {vehicle.qr ? vehicle.qr.visibleCode : "No sticker assigned"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* QR Status */}
          <Badge
            variant="outline"
            className={`font-mono text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 ${
              isQrActive
                ? "border-[#5db8a6]/40 bg-[#5db8a6]/10 text-[#5db8a6] hover:bg-[#5db8a6]/15 hover:text-[#5db8a6]"
                : "border-border bg-muted text-muted-foreground hover:bg-muted"
            }`}
          >
            QR: {isQrActive ? "ACTIVE" : vehicle.qr ? vehicle.qr.status : "UNBOUND"}
          </Badge>

          {/* Service Status */}
          <Badge
            variant="outline"
            className={`font-mono text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 ${
              isSubActive
                ? "border-[#5db8a6]/40 bg-[#5db8a6]/10 text-[#5db8a6] hover:bg-[#5db8a6]/15 hover:text-[#5db8a6]"
                : isBaseline
                ? "border-[#cc785c]/40 bg-[#cc785c]/10 text-[#cc785c] hover:bg-[#cc785c]/15 hover:text-[#cc785c]"
                : "border-border bg-muted text-muted-foreground hover:bg-muted"
            }`}
          >
            SERVICE: {isSubActive ? "PLAN ACTIVE" : isBaseline ? "BASELINE" : "NONE"}
          </Badge>
        </div>

        <button
          type="button"
          onClick={onInspect}
          className="shrink-0 inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-xs font-mono font-medium text-foreground hover:bg-muted transition-colors active:scale-[0.98]"
        >
          <span>Inspect</span>
          <VaahanIcon name="chevron-right" size={12} />
        </button>
      </div>
    </div>
  );
}
