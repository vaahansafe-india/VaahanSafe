"use client";

import { Button } from "@vaahansafe/ui";
import { VaahanIcon } from "@vaahansafe/icons";
import { ScanScopeSelector } from "./ScanScopeSelector";
import type { AuthorizedVehicleScope } from "@/lib/scan-history-types";

interface ScanHistoryHeaderProps {
  vehicles: AuthorizedVehicleScope[];
  selectedVehicleId: string;
  onSelectVehicle: (vehicleId: string) => void;
  onRefresh: () => void;
  onOpenPrivacyDialog: () => void;
  isRefreshing?: boolean;
}

export function ScanHistoryHeader({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  onRefresh,
  onOpenPrivacyDialog,
  isRefreshing,
}: ScanHistoryHeaderProps) {
  return (
    <div className="flex flex-col gap-5 sm:gap-6 md:flex-row md:items-end md:justify-between border-b border-border/70 pb-6">
      <div className="space-y-1.5 max-w-xl">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
          <VaahanIcon name="qr-scan" size={14} />
          <span>QR Activity &bull; Scan Intelligence</span>
        </div>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          See how your QR has been encountered.
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Review authentic encounters connected to your vehicle passes. Privacy-preserving telemetry with encrypted owner relay.
        </p>
      </div>

      {/* Action Cluster */}
      <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
        {vehicles.length > 0 && (
          <div className="flex-1 min-w-0 md:flex-initial">
            <ScanScopeSelector
              vehicles={vehicles}
              selectedVehicleId={selectedVehicleId}
              onSelectVehicle={onSelectVehicle}
            />
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenPrivacyDialog}
          className="h-10 sm:h-11 px-3 rounded-xl border-border bg-card hover:bg-muted/60 text-xs font-medium gap-1.5 shadow-xs shrink-0"
          title="Privacy Guarantees"
        >
          <VaahanIcon name="shield" size={15} className="text-muted-foreground" />
          <span className="hidden sm:inline">Privacy</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-10 sm:h-11 px-3 rounded-xl border-border bg-card hover:bg-muted/60 text-xs font-medium gap-1.5 shadow-xs shrink-0"
          title="Refresh scan history"
        >
          <VaahanIcon
            name="refresh"
            size={15}
            className={`text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`}
          />
          <span className="sr-only sm:not-sr-only sm:inline">Refresh</span>
        </Button>
      </div>
    </div>
  );
}
