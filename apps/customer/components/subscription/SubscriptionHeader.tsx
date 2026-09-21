"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { VehicleScopeSelector } from "./VehicleScopeSelector";
import type { ConnectedVehicleServiceItem } from "@/lib/subscription-types";

interface SubscriptionHeaderProps {
  vehicles: ConnectedVehicleServiceItem[];
  scopedVehicleId?: string;
  onExplorePlans: () => void;
  onRefresh?: () => void;
}

export function SubscriptionHeader({
  vehicles,
  scopedVehicleId,
  onExplorePlans,
  onRefresh,
}: SubscriptionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between pb-2">
      <div className="space-y-1 max-w-2xl">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c] font-semibold">
            Services / Subscription
          </span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Coverage Center
          </span>
        </div>
        <h1 className="mt-1 font-serif text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight text-foreground">
          Your VaahanSafe services.
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          See the services connected to your vehicle identities, manage your plan, and understand what is currently enabled.
        </p>
      </div>

      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto shrink-0">
        <div className="flex-1 sm:flex-initial min-w-0 w-full sm:w-auto">
          <VehicleScopeSelector
            vehicles={vehicles}
            scopedVehicleId={scopedVehicleId}
          />
        </div>

        <button
          type="button"
          onClick={onExplorePlans}
          className="shrink-0 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#cc785c] px-4 font-mono text-xs font-semibold uppercase tracking-wider text-white shadow-2xs hover:bg-[#a9583e] transition-all focus:outline-none focus:ring-2 focus:ring-[#cc785c]/30 active:scale-[0.98]"
        >
          <VaahanIcon name="shield" size={14} />
          <span className="whitespace-nowrap">Explore Plans</span>
        </button>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh service status"
            className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors active:scale-[0.98]"
          >
            <VaahanIcon name="loading" size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
