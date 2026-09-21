"use client";

import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";

interface VehicleEmptyStateProps {
  isFiltered?: boolean;
  onClearFilters?: () => void;
}

export function VehicleEmptyState({
  isFiltered = false,
  onClearFilters,
}: VehicleEmptyStateProps) {
  if (isFiltered) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
          <VaahanIcon name="vehicle" size={24} />
        </div>
        <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          NO MATCHING ASSETS
        </div>
        <h3 className="mt-1 font-serif text-xl font-medium text-foreground">
          No vehicles match the current filters.
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-xs text-muted-foreground">
          Try clearing or relaxing your search query, vehicle category, or QR lifeline status.
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 font-mono text-xs font-semibold uppercase tracking-wider text-foreground hover:bg-muted transition-colors"
          >
            Clear all filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-card to-card/60 p-8 sm:p-14 text-center shadow-xs">
      {/* Visual Identity Origin Rail */}
      <div className="mx-auto flex max-w-xs items-center justify-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-8">
        <div className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#cc785c] text-[#cc785c] font-bold text-[9px]">
            1
          </span>
          <span className="text-foreground font-semibold">VEHICLE</span>
        </div>
        <span className="h-px w-6 bg-border" />
        <div className="flex items-center gap-1.5 opacity-60">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-muted-foreground text-[9px]">
            2
          </span>
          <span>IDENTITY</span>
        </div>
        <span className="h-px w-6 bg-border" />
        <div className="flex items-center gap-1.5 opacity-40">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-muted-foreground text-[9px]">
            3
          </span>
          <span>QR</span>
        </div>
      </div>

      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#cc785c]/10 text-[#cc785c] shadow-inner">
        <VaahanIcon name="vehicle" size={32} />
      </div>

      <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.26em] text-[#cc785c]">
        VEHICLE IDENTITY REGISTRY
      </div>

      <h2 className="mt-2 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
        Add your first vehicle.
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground leading-relaxed">
        Your VaahanSafe safety network begins with the physical vehicle it belongs to. Connect your car, motorcycle, or commercial transport to establish its tamper-evident identity.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/vehicles/new"
          className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#cc785c] px-6 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-xs transition-all hover:bg-[#a9583e]"
        >
          <span>Add Vehicle</span>
          <VaahanIcon name="arrow-right" size={13} aria-hidden="true" />
        </Link>

        <Link
          href="/qr/activate"
          className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <VaahanIcon name="qr-scan" size={14} />
          <span>Activate Retail QR</span>
        </Link>
      </div>

      <p className="mt-6 text-[11px] text-muted-foreground">
        Zero dummy data &bull; Authoritative RTO license plate match &bull; Masked owner phone security
      </p>
    </div>
  );
}
