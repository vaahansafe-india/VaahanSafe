"use client";

import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type { NotificationFiltersState } from "@/lib/notifications-types";

interface ActiveNotificationFiltersProps {
  filters: NotificationFiltersState;
  onFilterChange: (filters: NotificationFiltersState) => void;
  vehicles: Array<{ id: string; registrationNumber: string; make: string; model: string }>;
  onResetFilters: () => void;
}

export function ActiveNotificationFilters({
  filters,
  onFilterChange,
  vehicles,
  onResetFilters,
}: ActiveNotificationFiltersProps) {
  const chips: Array<{ label: string; onRemove: () => void }> = [];

  if (filters.search) {
    chips.push({
      label: `"${filters.search}"`,
      onRemove: () => onFilterChange({ ...filters, search: "" }),
    });
  }

  if (filters.status !== "all") {
    chips.push({
      label: `Status: ${filters.status === "unread" ? "Unread" : "Read"}`,
      onRemove: () => onFilterChange({ ...filters, status: "all" }),
    });
  }

  if (filters.category !== "all") {
    chips.push({
      label: `Category: ${filters.category.toUpperCase()}`,
      onRemove: () => onFilterChange({ ...filters, category: "all" }),
    });
  }

  if (filters.vehicleId !== "all") {
    const v = vehicles.find((veh) => veh.id === filters.vehicleId);
    chips.push({
      label: v ? `${v.make} ${v.model}` : "Vehicle",
      onRemove: () => onFilterChange({ ...filters, vehicleId: "all" }),
    });
  }

  if (filters.attention !== "all") {
    chips.push({
      label: filters.attention === "action_required" ? "Needs Action" : "Informational",
      onRemove: () => onFilterChange({ ...filters, attention: "all" }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mr-1">
        Active Filters:
      </span>

      {chips.map((chip, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-1 rounded-lg border border-[#cc785c]/30 bg-[#cc785c]/10 px-2 py-0.5 font-mono text-[11px] text-[#cc785c]"
        >
          <span>{chip.label}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            className="hover:opacity-80 transition-opacity ml-0.5"
            aria-label={`Remove filter: ${chip.label}`}
          >
            <VaahanIcon name="close" size={10} />
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={onResetFilters}
        className="font-mono text-[11px] font-semibold text-muted-foreground hover:text-foreground underline ml-1"
      >
        Clear all
      </button>
    </div>
  );
}
