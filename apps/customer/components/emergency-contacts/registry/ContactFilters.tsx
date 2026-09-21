"use client";

import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@vaahansafe/ui";
import type {
  ContactsFilterState,
  ContactRoleType,
  VehicleOption,
} from "@/lib/contacts-types";
import { ROLE_DEFINITIONS } from "../roles/ContactRoleIcon";

interface ContactFiltersProps {
  filters: ContactsFilterState;
  onFilterChange: (filters: ContactsFilterState) => void;
  vehicles: VehicleOption[];
  onOpenFilterSheet: () => void;
  className?: string;
}

export function ContactFilters({
  filters,
  onFilterChange,
  vehicles,
  onOpenFilterSheet,
  className = "",
}: ContactFiltersProps) {
  const activeRoleDef = ROLE_DEFINITIONS.find((r) => r.type === filters.role);
  const activeVehicle = vehicles.find((v) => v.id === filters.vehicleId);

  const activeFiltersCount =
    (filters.role !== "all" ? 1 : 0) +
    (filters.vehicleId !== "all" ? 1 : 0) +
    (filters.visibility !== "all" ? 1 : 0);

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* 1. Role Filter Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 font-mono text-xs transition-colors ${
              filters.role !== "all"
                ? "border-[#cc785c] bg-[#cc785c]/10 text-[#cc785c]"
                : "border-input bg-background text-foreground hover:bg-muted/40"
            }`}
          >
            <span>Role:</span>
            <span className="font-semibold">{activeRoleDef ? activeRoleDef.label : "All"}</span>
            <VaahanIcon name="chevron-down" size={12} className="opacity-70" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 max-h-64 overflow-y-auto rounded-xl p-1">
          <DropdownMenuItem
            onClick={() => onFilterChange({ ...filters, role: "all" })}
            className="text-xs cursor-pointer"
          >
            All Roles
          </DropdownMenuItem>
          {ROLE_DEFINITIONS.map((r) => (
            <DropdownMenuItem
              key={r.type}
              onClick={() => onFilterChange({ ...filters, role: r.type })}
              className={`text-xs cursor-pointer flex items-center justify-between ${
                filters.role === r.type ? "font-bold text-[#cc785c]" : ""
              }`}
            >
              <span>{r.label}</span>
              {filters.role === r.type && <VaahanIcon name="check" size={12} />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 2. Vehicle Filter Dropdown (if multiple vehicles exist) */}
      {vehicles.length > 1 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 font-mono text-xs transition-colors ${
                filters.vehicleId !== "all"
                  ? "border-[#cc785c] bg-[#cc785c]/10 text-[#cc785c]"
                  : "border-input bg-background text-foreground hover:bg-muted/40"
              }`}
            >
              <span>Vehicle:</span>
              <span className="font-semibold">
                {activeVehicle ? activeVehicle.maskedPlate : "All"}
              </span>
              <VaahanIcon name="chevron-down" size={12} className="opacity-70" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 rounded-xl p-1">
            <DropdownMenuItem
              onClick={() => onFilterChange({ ...filters, vehicleId: "all" })}
              className="text-xs cursor-pointer"
            >
              All Vehicles
            </DropdownMenuItem>
            {vehicles.map((v) => (
              <DropdownMenuItem
                key={v.id}
                onClick={() => onFilterChange({ ...filters, vehicleId: v.id })}
                className={`text-xs cursor-pointer flex items-center justify-between ${
                  filters.vehicleId === v.id ? "font-bold text-[#cc785c]" : ""
                }`}
              >
                <span>{v.maskedPlate}</span>
                {filters.vehicleId === v.id && <VaahanIcon name="check" size={12} />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* 3. Visibility Filter Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 font-mono text-xs transition-colors ${
              filters.visibility !== "all"
                ? "border-[#cc785c] bg-[#cc785c]/10 text-[#cc785c]"
                : "border-input bg-background text-foreground hover:bg-muted/40"
            }`}
          >
            <span>Visibility:</span>
            <span className="font-semibold capitalize">
              {filters.visibility === "all" ? "All" : filters.visibility}
            </span>
            <VaahanIcon name="chevron-down" size={12} className="opacity-70" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44 rounded-xl p-1">
          <DropdownMenuItem
            onClick={() => onFilterChange({ ...filters, visibility: "all" })}
            className="text-xs cursor-pointer"
          >
            All Visibility
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onFilterChange({ ...filters, visibility: "public" })}
            className={`text-xs cursor-pointer flex items-center justify-between ${
              filters.visibility === "public" ? "font-bold text-[#5db8a6]" : ""
            }`}
          >
            <span>Public View Only</span>
            {filters.visibility === "public" && <VaahanIcon name="check" size={12} />}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onFilterChange({ ...filters, visibility: "private" })}
            className={`text-xs cursor-pointer flex items-center justify-between ${
              filters.visibility === "private" ? "font-bold text-[#cc785c]" : ""
            }`}
          >
            <span>Private (Hidden)</span>
            {filters.visibility === "private" && <VaahanIcon name="check" size={12} />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 4. Filter Sheet trigger */}
      <button
        type="button"
        onClick={onOpenFilterSheet}
        className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 font-mono text-xs transition-colors ${
          activeFiltersCount > 0
            ? "border-[#cc785c] bg-[#cc785c]/10 text-[#cc785c]"
            : "border-input bg-background text-foreground hover:bg-muted/40"
        }`}
      >
        <VaahanIcon name="filter" size={13} />
        <span>Filters</span>
        {activeFiltersCount > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#cc785c] text-[10px] font-bold text-white">
            {activeFiltersCount}
          </span>
        )}
      </button>
    </div>
  );
}
