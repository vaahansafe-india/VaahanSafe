"use client";

import * as React from "react";
import { ConnectedVehicleRow } from "./ConnectedVehicleRow";
import { VaahanIcon } from "@vaahansafe/icons";
import type { ConnectedVehicleServiceItem } from "@/lib/subscription-types";

interface ConnectedVehicleIdentitiesProps {
  vehicles: ConnectedVehicleServiceItem[];
  scopedVehicleId?: string;
  onSelectVehicle: (id: string) => void;
  onInspectVehicle: (vehicle: ConnectedVehicleServiceItem) => void;
  onAddVehicleService: () => void;
}

export function ConnectedVehicleIdentities({
  vehicles,
  scopedVehicleId,
  onSelectVehicle,
  onInspectVehicle,
  onAddVehicleService,
}: ConnectedVehicleIdentitiesProps) {
  return (
    <section 
      aria-label="Connected Vehicle Identities" 
      className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c] font-semibold">
              Fleet & Identity Ledger
            </span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="font-mono text-xs text-muted-foreground">
              {vehicles.length} Vehicle Identity{vehicles.length !== 1 ? "ies" : ""}
            </span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-foreground">
            Connected Vehicle Identities
          </h3>
        </div>

        <button
          type="button"
          onClick={onAddVehicleService}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-mono font-medium text-foreground hover:bg-muted transition-colors"
        >
          <VaahanIcon name="vehicle" size={13} className="text-[#cc785c]" />
          <span>Add Vehicle</span>
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <p className="text-sm text-muted-foreground">No vehicles registered under this account.</p>
          <button
            type="button"
            onClick={onAddVehicleService}
            className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#cc785c] hover:underline"
          >
            Add your first vehicle →
          </button>
        </div>
      ) : (
        <div className="space-y-2.5 pt-1">
          {vehicles.map((v, i) => (
            <ConnectedVehicleRow
              key={v.id}
              vehicle={v}
              index={i}
              isSelected={scopedVehicleId === v.id}
              onSelect={() => onSelectVehicle(v.id)}
              onInspect={() => onInspectVehicle(v)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
