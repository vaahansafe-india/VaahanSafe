"use client";

import React from "react";
import type {
  NotificationItem,
  NotificationDateGroup,
  NotificationFiltersState,
} from "@/lib/notifications-types";
import { NotificationEvent } from "./NotificationEvent";
import {
  NotificationEmptyState,
  NotificationUnreadEmpty,
  NotificationFilteredEmpty,
} from "../states/NotificationEmptyStates";

interface NotificationInboxProps {
  notifications: NotificationItem[];
  groupedNotifications: Record<NotificationDateGroup, NotificationItem[]>;
  filters: NotificationFiltersState;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpenDetails: (notification: NotificationItem) => void;
  onToggleRead: (notification: NotificationItem) => void;
  onArchive: (notification: NotificationItem) => void;
  onResetFilters: () => void;
  onSelectInboxView: () => void;
  totalUnfilteredCount: number;
}

const GROUP_LABELS: Record<NotificationDateGroup, string> = {
  TODAY: "Today",
  YESTERDAY: "Yesterday",
  THIS_WEEK: "This Week",
  EARLIER: "Earlier",
};

export function NotificationInbox({
  notifications,
  groupedNotifications,
  filters,
  selectedIds,
  onToggleSelect,
  onOpenDetails,
  onToggleRead,
  onArchive,
  onResetFilters,
  onSelectInboxView,
  totalUnfilteredCount,
}: NotificationInboxProps) {
  // Empty state handling
  if (notifications.length === 0) {
    if (filters.view === "unread") {
      return <NotificationUnreadEmpty onViewInbox={onSelectInboxView} />;
    }

    const hasActiveFilters =
      filters.status !== "all" ||
      filters.category !== "all" ||
      filters.vehicleId !== "all" ||
      filters.attention !== "all" ||
      Boolean(filters.search);

    if (hasActiveFilters) {
      return <NotificationFilteredEmpty onClearFilters={onResetFilters} />;
    }

    return <NotificationEmptyState isFreshAccount={totalUnfilteredCount === 0} />;
  }

  const groups: NotificationDateGroup[] = ["TODAY", "YESTERDAY", "THIS_WEEK", "EARLIER"];

  return (
    <div className="space-y-6">
      {groups.map((groupKey) => {
        const groupItems = groupedNotifications[groupKey];
        if (!groupItems || groupItems.length === 0) return null;

        return (
          <div key={groupKey} className="space-y-1">
            {/* Group Editorial Separator */}
            <div className="flex items-center gap-2 px-3 py-1">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {GROUP_LABELS[groupKey]}
              </span>
              <div className="flex-1 border-t border-border/40" />
              <span className="font-mono text-[10px] text-muted-foreground/60">
                {groupItems.length}
              </span>
            </div>

            {/* Notification Rows */}
            <div className="divide-y divide-border/60 rounded-2xl border border-border/70 bg-card shadow-2xs overflow-hidden">
              {groupItems.map((notification, idx) => (
                <NotificationEvent
                  key={notification.id}
                  notification={notification}
                  isSelected={selectedIds.has(notification.id)}
                  onToggleSelect={onToggleSelect}
                  onOpenDetails={onOpenDetails}
                  onToggleRead={onToggleRead}
                  onArchive={onArchive}
                  isLastInGroup={idx === groupItems.length - 1}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
