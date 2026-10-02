"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { VehicleContextSelector } from "./VehicleContextSelector";
import { Button } from "@/components/ui/button";
import type { DashboardVehicle } from "@/lib/dashboard-types";

interface DashboardHeaderProps {
  vehicles: DashboardVehicle[];
  activeVehicle: DashboardVehicle | null;
  unreadNotifications: number;
  activeFilterCount: number;
  onOpenNotifications: () => void;
  onOpenFilters: () => void;
  onOpenCommandPalette: () => void;
}

export function DashboardHeader({
  vehicles,
  activeVehicle,
  unreadNotifications,
  activeFilterCount,
  onOpenNotifications,
  onOpenFilters,
  onOpenCommandPalette,
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-col justify-between gap-5 border-b border-border/60 pb-6 xl:flex-row xl:items-end w-full">
      {/* Editorial Identity Header */}
      <div className="space-y-1.5 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[#cc785c] whitespace-nowrap">
            VAAHANSAFE / CUSTOMER IDENTITY
          </span>
          <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-border" />
          <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5db8a6]" />
            ACCOUNT OVERVIEW
          </span>
        </div>

        <h1 className="font-serif text-3xl font-normal tracking-tight text-foreground sm:text-4xl">
          Your vehicle identity.
        </h1>

        <p className="max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Manage your vehicle, QR, safety information and recent scan activity.
        </p>
      </div>

      {/* Control Rails & Selectors */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap w-full xl:w-auto">
        {/* Command Palette Trigger */}
        <Button
          type="button"
          variant="outline"
          onClick={onOpenCommandPalette}
          className="hidden h-11 shrink-0 gap-2 bg-card px-3 text-xs text-muted-foreground hover:border-[#cc785c]/40 hover:text-foreground sm:inline-flex"
          title="Open Command Launcher (Ctrl+K or ⌘K)"
        >
          <VaahanIcon name="search" size={18} />
          <span className="font-mono text-[11px]">Command</span>
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
            Ctrl / ⌘ K
          </kbd>
        </Button>

        {/* Filter Trigger */}
        <Button
          type="button"
          variant="outline"
          onClick={onOpenFilters}
          className="h-11 shrink-0 gap-2 bg-card px-3 text-xs hover:border-[#cc785c]/40 sm:px-3.5"
        >
          <VaahanIcon name="adjustments" size={18} className="text-[#cc785c]" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#cc785c] font-mono text-[9px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* Notification Bell with Real Unread Badge */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onOpenNotifications}
          className="relative size-11 shrink-0 bg-card hover:border-[#cc785c]/40"
          aria-label={`Notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ""}`}
          title="Notifications"
        >
          <VaahanIcon name="bell" size={18} />
          {unreadNotifications > 0 && (
            <span
              aria-hidden="true"
              className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#cc785c] px-1 font-mono text-[9px] font-bold text-white shadow-xs"
            >
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </span>
          )}
        </Button>

        {/* Vehicle Context Selector — Flexes full width on mobile, auto width on tablet/desktop */}
        <div className="flex-1 min-w-0 sm:flex-initial">
          <VehicleContextSelector
            vehicles={vehicles}
            activeVehicle={activeVehicle}
          />
        </div>
      </div>
    </header>
  );
}
