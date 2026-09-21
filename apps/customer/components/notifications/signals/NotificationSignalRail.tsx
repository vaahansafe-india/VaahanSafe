"use client";

import React from "react";
import type { NotificationCenterCounts, NotificationViewType } from "@/lib/notifications-types";
import { VaahanIcon } from "@vaahansafe/icons";

interface NotificationSignalRailProps {
  counts: NotificationCenterCounts;
  currentView: NotificationViewType;
  onSelectView: (view: NotificationViewType) => void;
}

export function NotificationSignalRail({
  counts,
  currentView,
  onSelectView,
}: NotificationSignalRailProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 w-full min-w-0">
      {/* 1. Unread Signal */}
      <button
        type="button"
        onClick={() => onSelectView("unread")}
        className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all text-left min-w-0 ${
          currentView === "unread"
            ? "border-[#cc785c] bg-[#cc785c]/5 shadow-xs"
            : "border-border/70 bg-card hover:border-border"
        }`}
      >
        <div className="min-w-0 flex-1 mr-2">
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground block truncate">
            Unread
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-foreground block truncate">
            {counts.unread}
          </span>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#cc785c]/10 text-[#cc785c] shrink-0">
          <VaahanIcon name="notification" size={15} />
        </div>
      </button>

      {/* 2. Needs Attention Signal */}
      <button
        type="button"
        onClick={() => onSelectView("attention")}
        className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all text-left min-w-0 ${
          currentView === "attention"
            ? "border-[#e8a55a] bg-[#e8a55a]/10 shadow-xs"
            : "border-border/70 bg-card hover:border-border"
        }`}
      >
        <div className="min-w-0 flex-1 mr-2">
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground block truncate">
            Needs Action
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-foreground block truncate">
            {counts.attention}
          </span>
        </div>
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 ${
          counts.attention > 0 ? "bg-[#e8a55a]/20 text-[#e8a55a]" : "bg-muted/40 text-muted-foreground"
        }`}>
          <VaahanIcon name="warning" size={15} />
        </div>
      </button>

      {/* 3. Today's Activity */}
      <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border border-border/70 bg-card text-left min-w-0">
        <div className="min-w-0 flex-1 mr-2">
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground block truncate">
            Today
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-foreground block truncate">
            {counts.today}
          </span>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5db8a6]/10 text-[#5db8a6] shrink-0">
          <VaahanIcon name="clock" size={15} />
        </div>
      </div>

      {/* 4. Active Vehicles Linked */}
      <button
        type="button"
        onClick={() => onSelectView("vehicles")}
        className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all text-left min-w-0 ${
          currentView === "vehicles"
            ? "border-[#5db8a6] bg-[#5db8a6]/5 shadow-xs"
            : "border-border/70 bg-card hover:border-border"
        }`}
      >
        <div className="min-w-0 flex-1 mr-2">
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground block truncate">
            Vehicles
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-foreground block truncate">
            {counts.vehiclesCount}
          </span>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5db8a6]/10 text-[#5db8a6] shrink-0">
          <VaahanIcon name="car" size={15} />
        </div>
      </button>
    </div>
  );
}
