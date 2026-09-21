"use client";

import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type {
  ContactsFilterState,
  VehicleOption,
} from "@/lib/contacts-types";
import { ROLE_DEFINITIONS } from "../roles/ContactRoleIcon";

interface ActiveContactFiltersProps {
  filters: ContactsFilterState;
  vehicles: VehicleOption[];
  onRemoveFilter: (key: keyof ContactsFilterState) => void;
  onResetFilters: () => void;
  className?: string;
}

export function ActiveContactFilters({
  filters,
  vehicles,
  onRemoveFilter,
  onResetFilters,
  className = "",
}: ActiveContactFiltersProps) {
  const activeRoleDef = ROLE_DEFINITIONS.find((r) => r.type === filters.role);
  const activeVehicle = vehicles.find((v) => v.id === filters.vehicleId);

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.role !== "all" ||
    filters.vehicleId !== "all" ||
    filters.visibility !== "all";

  if (!hasActiveFilters) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 pt-2 ${className}`}>
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        Active Filters:
      </span>

      {filters.search.trim() !== "" && (
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 font-mono text-[11px] text-foreground">
          <span>Search: &ldquo;{filters.search}&rdquo;</span>
          <button
            type="button"
            onClick={() => onRemoveFilter("search")}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Remove search filter"
          >
            <VaahanIcon name="close" size={11} />
          </button>
        </span>
      )}

      {filters.role !== "all" && activeRoleDef && (
        <span className="inline-flex items-center gap-1 rounded-full border border-[#cc785c]/30 bg-[#cc785c]/10 px-2.5 py-0.5 font-mono text-[11px] text-[#cc785c]">
          <span>Role: {activeRoleDef.label}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter("role")}
            className="hover:text-[#a9583e]"
            aria-label="Remove role filter"
          >
            <VaahanIcon name="close" size={11} />
          </button>
        </span>
      )}

      {filters.vehicleId !== "all" && activeVehicle && (
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 font-mono text-[11px] text-foreground">
          <span>Vehicle: {activeVehicle.maskedPlate}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter("vehicleId")}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Remove vehicle filter"
          >
            <VaahanIcon name="close" size={11} />
          </button>
        </span>
      )}

      {filters.visibility !== "all" && (
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 font-mono text-[11px] text-foreground">
          <span>Visibility: {filters.visibility === "public" ? "Public Only" : "Private"}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter("visibility")}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Remove visibility filter"
          >
            <VaahanIcon name="close" size={11} />
          </button>
        </span>
      )}

      <button
        type="button"
        onClick={onResetFilters}
        className="font-mono text-[11px] font-semibold text-[#cc785c] hover:underline ml-1"
      >
        Clear All
      </button>
    </div>
  );
}
