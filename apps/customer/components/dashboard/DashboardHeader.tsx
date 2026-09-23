"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { VehicleContextSelector } from "./VehicleContextSelector";
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
            DASHBOARD / 01 &bull; LIVE STATUS
          </span>
        </div>

        <h1 className="font-serif text-3xl font-normal tracking-tight text-foreground sm:text-4xl">
          Your vehicle identity.
        </h1>

        <p className="max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
          See the current state of your vehicle, QR, safety view, and real-time emergency scan activity.
        </p>
      </div>

      {/* Control Rails & Selectors */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap w-full xl:w-auto">
        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="hidden sm:flex h-10 shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs text-muted-foreground shadow-2xs transition-all hover:border-[#cc785c]/40 hover:text-foreground"
          title="Open Command Launcher (Ctrl+K or ⌘K)"
        >
          <VaahanIcon name="search" size={13} />
          <span className="font-mono text-[11px]">Command</span>
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
            ⌘K
          </kbd>
        </button>

        {/* Filter Trigger */}
        <button
          type="button"
          onClick={onOpenFilters}
          className="flex h-10 shrink-0 items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-border bg-card px-3 sm:px-3.5 text-xs font-medium text-foreground shadow-2xs transition-all hover:border-[#cc785c]/40 hover:shadow-xs"
        >
          <VaahanIcon name="settings" size={14} className="text-[#cc785c]" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#cc785c] font-mono text-[9px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Notification Bell with Real Unread Badge */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-2xs transition-all hover:border-[#cc785c]/40 hover:shadow-xs"
          aria-label="View In-App Notifications"
        >
          <VaahanIcon name="bell" size={16} />
          {unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#cc785c] px-1 font-mono text-[9px] font-bold text-white shadow-xs">
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </span>
          )}
        </button>

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
