"use client";

import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@vaahansafe/ui";
import type { VehicleFilterState, VehicleCategory } from "@/lib/vehicle-types";

interface VehicleRegistryHeaderProps {
  totalCount: number;
  filters: VehicleFilterState;
  onFilterChange: (filters: VehicleFilterState) => void;
  onOpenFilterSheet: () => void;
}

export function VehicleRegistryHeader({
  totalCount,
  filters,
  onFilterChange,
  onOpenFilterSheet,
}: VehicleRegistryHeaderProps) {
  const formattedCount = String(totalCount).padStart(2, "0");

  const activeFiltersCount =
    (filters.types && filters.types.length > 0 ? filters.types.length : 0) +
    (filters.qrStatus && filters.qrStatus !== "ALL" ? 1 : 0) +
    (filters.safetyStatus && filters.safetyStatus !== "ALL" ? 1 : 0);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      query: e.target.value,
    });
  };

  const handleRemoveTypeChip = (t: VehicleCategory) => {
    onFilterChange({
      ...filters,
      types: filters.types?.filter((item) => item !== t),
    });
  };

  const handleRemoveQrChip = () => {
    onFilterChange({
      ...filters,
      qrStatus: "ALL",
    });
  };

  const handleRemoveSafetyChip = () => {
    onFilterChange({
      ...filters,
      safetyStatus: "ALL",
    });
  };

  const handleClearAll = () => {
    onFilterChange({
      ...filters,
      query: "",
      types: [],
      qrStatus: "ALL",
      safetyStatus: "ALL",
    });
  };

  return (
    <div className="space-y-6">
      {/* 01. Brand Eyebrow & Title */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
            <span>VAAHANSAFE / VEHICLE REGISTRY</span>
          </div>
          <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Your vehicles,
            <br className="hidden sm:inline" /> connected to their identities.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground leading-relaxed">
            Manage the vehicles associated with your VaahanSafe account and understand how each physical asset connects to its identity, QR and safety view.
          </p>
        </div>

        {/* Dynamic Registry Counter */}
        <div className="flex flex-col items-end">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            VEHICLE REGISTRY / {formattedCount}
          </div>
          <div className="mt-1 font-mono text-[11px] text-[#5db8a6]">
            Verified &amp; Synchronized
          </div>
        </div>
      </div>

      {/* 02. Controls Surface (Search, Filters, Sort, View Switcher, Add CTA) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
            <VaahanIcon name="search" size={15} />
          </div>
          <input
            type="text"
            value={filters.query || ""}
            onChange={handleSearchChange}
            placeholder="Search make, model, plate, or VS-ID..."
            className="h-9 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
          />
        </div>

        {/* Right Tools Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filters Sheet Trigger */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenFilterSheet}
            className={`h-9 gap-1.5 font-mono text-xs ${
              activeFiltersCount > 0
                ? "border-[#cc785c] text-[#cc785c] bg-[#cc785c]/10"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <VaahanIcon name="menu" size={14} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#cc785c] text-[9px] font-bold text-white">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          {/* Sort Selector using shadcn/ui Select */}
          <Select
            value={filters.sort}
            onValueChange={(val) =>
              onFilterChange({
                ...filters,
                sort: val as any,
              })
            }
          >
            <SelectTrigger className="h-9 w-[175px] rounded-xl border-border bg-background font-mono text-xs text-muted-foreground hover:text-foreground focus:ring-[#cc785c]">
              <span className="text-muted-foreground mr-1">Sort:</span>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent align="end" className="font-mono text-xs">
              <SelectItem value="RECENT">Recent</SelectItem>
              <SelectItem value="NAME">Make/Model</SelectItem>
              <SelectItem value="ATTENTION">Needs Attention</SelectItem>
            </SelectContent>
          </Select>

          {/* View Switcher (REGISTRY vs COMPACT) */}
          <div className="hidden sm:flex items-center rounded-xl border border-border bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, viewMode: "REGISTRY" })}
              className={`rounded-lg px-2.5 py-1 font-mono text-[11px] font-medium transition-all ${
                filters.viewMode === "REGISTRY"
                  ? "bg-card text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              REGISTRY
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, viewMode: "COMPACT" })}
              className={`rounded-lg px-2.5 py-1 font-mono text-[11px] font-medium transition-all ${
                filters.viewMode === "COMPACT"
                  ? "bg-card text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              COMPACT
            </button>
          </div>

          {/* Primary CTA */}
          <Link
            href="/vehicles/new"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#cc785c] px-3.5 font-mono text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-all hover:bg-[#a9583e]"
          >
            <span className="text-sm leading-none font-bold">+</span>
            <span>Add Vehicle</span>
          </Link>
        </div>
      </div>

      {/* 03. Active Filter Chips */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
          <span className="text-muted-foreground text-[11px] uppercase tracking-wider">
            Active:
          </span>

          {filters.types?.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#cc785c]/30 bg-[#cc785c]/10 px-2.5 py-1 text-xs text-[#cc785c]"
            >
              <span>Type: {t}</span>
              <button
                type="button"
                onClick={() => handleRemoveTypeChip(t)}
                className="hover:text-foreground"
                aria-label={`Remove filter for ${t}`}
              >
                &times;
              </button>
            </span>
          ))}

          {filters.qrStatus && filters.qrStatus !== "ALL" && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#cc785c]/30 bg-[#cc785c]/10 px-2.5 py-1 text-xs text-[#cc785c]">
              <span>QR: {filters.qrStatus}</span>
              <button
                type="button"
                onClick={handleRemoveQrChip}
                className="hover:text-foreground"
                aria-label="Remove QR filter"
              >
                &times;
              </button>
            </span>
          )}

          {filters.safetyStatus && filters.safetyStatus !== "ALL" && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#cc785c]/30 bg-[#cc785c]/10 px-2.5 py-1 text-xs text-[#cc785c]">
              <span>Safety: {filters.safetyStatus === "CONFIGURED" ? "Configured" : "Needs Setup"}</span>
              <button
                type="button"
                onClick={handleRemoveSafetyChip}
                className="hover:text-foreground"
                aria-label="Remove safety view filter"
              >
                &times;
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={handleClearAll}
            className="text-[11px] text-muted-foreground hover:text-[#cc785c] underline ml-1"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
