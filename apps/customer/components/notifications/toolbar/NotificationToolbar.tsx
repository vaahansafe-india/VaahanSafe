"use client";

import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type { NotificationFiltersState, NotificationCenterCounts, NotificationViewType } from "@/lib/notifications-types";
import { MobileNotificationViewDrawer } from "../drawers/MobileNotificationViewDrawer";

interface NotificationToolbarProps {
  filters: NotificationFiltersState;
  onFilterChange: (filters: NotificationFiltersState) => void;
  onOpenFilterSheet: () => void;
  onOpenMarkAllDialog: () => void;
  counts: NotificationCenterCounts;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  onToggleSelectAll: () => void;
  hasNotifications: boolean;
  selectedCount: number;
}

export function NotificationToolbar({
  filters,
  onFilterChange,
  onOpenFilterSheet,
  onOpenMarkAllDialog,
  counts,
  isAllSelected,
  isIndeterminate,
  onToggleSelectAll,
  hasNotifications,
  selectedCount,
}: NotificationToolbarProps) {
  const activeFiltersCount =
    (filters.status !== "all" ? 1 : 0) +
    (filters.category !== "all" ? 1 : 0) +
    (filters.vehicleId !== "all" ? 1 : 0) +
    (filters.attention !== "all" ? 1 : 0) +
    (filters.search ? 1 : 0);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-3 border-b border-border/70 w-full min-w-0">
      {/* Mobile & Tablet view drawer & select all master checkbox */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="lg:hidden">
          <MobileNotificationViewDrawer
            currentView={filters.view}
            counts={counts}
            onSelectView={(view: NotificationViewType) => onFilterChange({ ...filters, view })}
          />
        </div>

        {hasNotifications && (
          <div className="flex items-center gap-2">
            <label className="relative flex items-center justify-center cursor-pointer p-1">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(el) => {
                  if (el) el.indeterminate = isIndeterminate;
                }}
                onChange={onToggleSelectAll}
                className="h-4 w-4 rounded border-input text-[#cc785c] focus:ring-1 focus:ring-[#cc785c] accent-[#cc785c] cursor-pointer"
                title="Select all notifications on page"
                aria-label="Select all notifications"
              />
            </label>
            <span className="font-mono text-xs text-muted-foreground hidden xs:inline">
              {selectedCount > 0 ? `${selectedCount} selected` : "Select all"}
            </span>
          </div>
        )}
      </div>

      {/* Search Input & Action Buttons */}
      <div className="flex items-center gap-2 flex-1 min-w-0 sm:justify-end">
        {/* Search input */}
        <div className="relative flex-1 min-w-0 sm:max-w-xs">
          <VaahanIcon
            name="search"
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            placeholder="Search activity, plate, QR..."
            className="h-9 w-full min-w-0 rounded-xl border border-input bg-background pl-8 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, search: "" })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <VaahanIcon name="close" size={12} />
            </button>
          )}
        </div>

        {/* Filters button */}
        <button
          type="button"
          onClick={onOpenFilterSheet}
          className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-2.5 font-mono text-xs transition-colors shrink-0 ${
            activeFiltersCount > 0
              ? "border-[#cc785c] bg-[#cc785c]/10 text-[#cc785c]"
              : "border-input bg-background text-foreground hover:bg-muted/40"
          }`}
          aria-label="Filter notifications"
        >
          <VaahanIcon name="filter" size={13} />
          <span className="hidden xs:inline">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#cc785c] text-[10px] font-bold text-white">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Mark all as read button (shown if there are unread items) */}
        {counts.unread > 0 && (
          <button
            type="button"
            onClick={onOpenMarkAllDialog}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 font-mono text-xs font-semibold text-foreground transition-colors hover:border-[#cc785c] hover:text-[#cc785c] shrink-0"
            title="Mark all notifications in current inbox as read"
            aria-label="Mark all as read"
          >
            <VaahanIcon name="check" size={13} />
            <span className="hidden md:inline">Mark all read</span>
          </button>
        )}
      </div>
    </div>
  );
}
