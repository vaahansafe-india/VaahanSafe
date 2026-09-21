"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type {
  NotificationItem,
  NotificationCenterData,
  NotificationFiltersState,
  NotificationViewType,
} from "@/lib/notifications-types";
import {
  markNotificationAsReadAction,
  markNotificationAsUnreadAction,
  archiveNotificationAction,
  unarchiveNotificationAction,
  bulkMarkAsReadAction,
  bulkMarkAsUnreadAction,
  bulkArchiveAction,
  markAllAsReadAction,
} from "@/lib/notifications-actions";
import { NotificationCenterHeader } from "./NotificationCenterHeader";
import { NotificationSignalRail } from "./signals/NotificationSignalRail";
import { NotificationViewRail } from "./views/NotificationViewRail";
import { NotificationToolbar } from "./toolbar/NotificationToolbar";
import { ActiveNotificationFilters } from "./toolbar/ActiveNotificationFilters";
import { BulkNotificationActions } from "./toolbar/BulkNotificationActions";
import { NotificationInbox } from "./inbox/NotificationInbox";
import { NotificationDetailSheet } from "./sheets/NotificationDetailSheet";
import { NotificationFiltersSheet } from "./sheets/NotificationFiltersSheet";
import { NotificationSettingsSheet } from "./sheets/NotificationSettingsSheet";
import { MarkAllReadAlert } from "./alerts/MarkAllReadAlert";

interface NotificationCenterControllerProps {
  initialData: NotificationCenterData;
}

export function NotificationCenterController({
  initialData,
}: NotificationCenterControllerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state initialized from server data
  const [data, setData] = React.useState<NotificationCenterData>(initialData);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [activeDetailItem, setActiveDetailItem] = React.useState<NotificationItem | null>(null);
  const [filterSheetOpen, setFilterSheetOpen] = React.useState(false);
  const [settingsSheetOpen, setSettingsSheetOpen] = React.useState(false);
  const [markAllAlertOpen, setMarkAllAlertOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  // Keep state synced with incoming server updates
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // URL query sync helper
  const updateUrlFilters = (newFilters: NotificationFiltersState) => {
    const params = new URLSearchParams();
    if (newFilters.view !== "inbox") params.set("view", newFilters.view);
    if (newFilters.status !== "all") params.set("status", newFilters.status);
    if (newFilters.category !== "all") params.set("category", newFilters.category);
    if (newFilters.vehicleId !== "all") params.set("vehicle", newFilters.vehicleId);
    if (newFilters.attention !== "all") params.set("attention", newFilters.attention);
    if (newFilters.search) params.set("q", newFilters.search);

    const query = params.toString();
    router.replace(`/notifications${query ? `?${query}` : ""}`, { scroll: false });
  };

  const handleFilterChange = (newFilters: NotificationFiltersState) => {
    updateUrlFilters(newFilters);
  };

  const handleResetFilters = () => {
    const cleared: NotificationFiltersState = {
      ...data.filters,
      status: "all",
      category: "all",
      vehicleId: "all",
      attention: "all",
      search: "",
    };
    updateUrlFilters(cleared);
  };

  const handleSelectView = (view: NotificationViewType) => {
    const updated: NotificationFiltersState = {
      ...data.filters,
      view,
    };
    updateUrlFilters(updated);
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isAllSelected =
    data.notifications.length > 0 &&
    data.notifications.every((n) => selectedIds.has(n.id));

  const isIndeterminate =
    selectedIds.size > 0 && selectedIds.size < data.notifications.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.notifications.map((n) => n.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Single item actions (with optimistic UI)
  const handleToggleRead = (item: NotificationItem) => {
    const isCurrentlyRead = item.isRead;
    const previousNotifications = [...data.notifications];

    // Optimistic update
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === item.id ? { ...n, isRead: !isCurrentlyRead, readAt: !isCurrentlyRead ? new Date().toISOString() : null } : n
      ),
      counts: {
        ...prev.counts,
        unread: isCurrentlyRead ? prev.counts.unread + 1 : Math.max(0, prev.counts.unread - 1),
      },
    }));

    startTransition(async () => {
      const res = isCurrentlyRead
        ? await markNotificationAsUnreadAction(item.id)
        : await markNotificationAsReadAction(item.id);

      if (!res.success) {
        toast.error("Couldn't update read status. Please try again.");
        setData((prev) => ({ ...prev, notifications: previousNotifications }));
      }
    });
  };

  const handleArchive = (item: NotificationItem) => {
    const isCurrentlyArchived = item.isArchived;
    const previousNotifications = [...data.notifications];

    // Optimistic update
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== item.id),
      counts: {
        ...prev.counts,
        inbox: isCurrentlyArchived ? prev.counts.inbox + 1 : Math.max(0, prev.counts.inbox - 1),
        archived: isCurrentlyArchived ? Math.max(0, prev.counts.archived - 1) : prev.counts.archived + 1,
      },
    }));

    startTransition(async () => {
      const res = isCurrentlyArchived
        ? await unarchiveNotificationAction(item.id)
        : await archiveNotificationAction(item.id);

      if (res.success) {
        toast.success(isCurrentlyArchived ? "Notification moved to inbox" : "Notification archived", {
          action: {
            label: "Undo",
            onClick: () => {
              if (isCurrentlyArchived) {
                archiveNotificationAction(item.id);
              } else {
                unarchiveNotificationAction(item.id);
              }
            },
          },
        });
      } else {
        toast.error("Couldn't archive notification. Please try again.");
        setData((prev) => ({ ...prev, notifications: previousNotifications }));
      }
    });
  };

  // Bulk actions
  const handleBulkMarkRead = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    startTransition(async () => {
      const res = await bulkMarkAsReadAction(ids);
      if (res.success) {
        toast.success(`${ids.length} ${ids.length === 1 ? "notification" : "notifications"} marked as read.`);
        setSelectedIds(new Set());
      } else {
        toast.error(res.error || "Failed to mark notifications as read.");
      }
    });
  };

  const handleBulkMarkUnread = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    startTransition(async () => {
      const res = await bulkMarkAsUnreadAction(ids);
      if (res.success) {
        toast.success(`${ids.length} ${ids.length === 1 ? "notification" : "notifications"} marked as unread.`);
        setSelectedIds(new Set());
      } else {
        toast.error(res.error || "Failed to mark notifications as unread.");
      }
    });
  };

  const handleBulkArchive = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    startTransition(async () => {
      const res = await bulkArchiveAction(ids);
      if (res.success) {
        toast.success(`${ids.length} ${ids.length === 1 ? "notification" : "notifications"} archived.`);
        setSelectedIds(new Set());
      } else {
        toast.error(res.error || "Failed to archive notifications.");
      }
    });
  };

  const handleConfirmMarkAllRead = () => {
    startTransition(async () => {
      const res = await markAllAsReadAction();
      setMarkAllAlertOpen(false);
      if (res.success) {
        toast.success("All notifications marked as read.");
      } else {
        toast.error(res.error || "Failed to mark all as read.");
      }
    });
  };

  // Keyboard navigation (j/k, e to archive, r to toggle read)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside an input or editable element
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || (document.activeElement as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.key === "e" && selectedIds.size > 0) {
        e.preventDefault();
        handleBulkArchive();
      } else if (e.key === "r" && selectedIds.size > 0) {
        e.preventDefault();
        handleBulkMarkRead();
      } else if (e.key === "Escape") {
        setSelectedIds(new Set());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds]);

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      {/* Header */}
      <NotificationCenterHeader
        onOpenSettings={() => setSettingsSheetOpen(true)}
        unreadCount={data.counts.unread}
      />

      {/* Signal Strip */}
      <NotificationSignalRail
        counts={data.counts}
        currentView={data.filters.view}
        onSelectView={handleSelectView}
      />

      {/* Main Inbox Workspace */}
      <div className="flex items-start gap-5 lg:gap-6 w-full min-w-0">
        {/* Desktop Left Rail (visible on lg and above) */}
        <div className="hidden lg:block w-52 xl:w-56 shrink-0 rounded-3xl border border-border/80 bg-card p-4 shadow-2xs">
          <NotificationViewRail
            currentView={data.filters.view}
            counts={data.counts}
            onSelectView={handleSelectView}
          />
        </div>

        {/* Center Content: Toolbar, Filters, and Activity Inbox */}
        <div className="flex-1 min-w-0 max-w-full space-y-3.5">
          <div className="rounded-3xl border border-border/80 bg-card p-3.5 sm:p-5 shadow-2xs space-y-3 min-w-0 max-w-full overflow-hidden">
            {/* Toolbar */}
            <NotificationToolbar
              filters={data.filters}
              onFilterChange={handleFilterChange}
              onOpenFilterSheet={() => setFilterSheetOpen(true)}
              onOpenMarkAllDialog={() => setMarkAllAlertOpen(true)}
              counts={data.counts}
              isAllSelected={isAllSelected}
              isIndeterminate={isIndeterminate}
              onToggleSelectAll={handleToggleSelectAll}
              hasNotifications={data.notifications.length > 0}
              selectedCount={selectedIds.size}
            />

            {/* Contextual Bulk Action Rail */}
            <BulkNotificationActions
              selectedCount={selectedIds.size}
              onMarkRead={handleBulkMarkRead}
              onMarkUnread={handleBulkMarkUnread}
              onArchive={handleBulkArchive}
              onClearSelection={handleClearSelection}
              isPending={isPending}
            />

            {/* Active Filter Chips */}
            <ActiveNotificationFilters
              filters={data.filters}
              onFilterChange={handleFilterChange}
              vehicles={data.authorizedVehicles}
              onResetFilters={handleResetFilters}
            />

            {/* Notification Activity List */}
            <div className="pt-2">
              <NotificationInbox
                notifications={data.notifications}
                groupedNotifications={data.groupedNotifications}
                filters={data.filters}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onOpenDetails={(notif) => setActiveDetailItem(notif)}
                onToggleRead={handleToggleRead}
                onArchive={handleArchive}
                onResetFilters={handleResetFilters}
                onSelectInboxView={() => handleSelectView("inbox")}
                totalUnfilteredCount={data.counts.inbox + data.counts.archived}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sheets & Alert Dialogs */}
      <NotificationDetailSheet
        notification={activeDetailItem}
        open={Boolean(activeDetailItem)}
        onOpenChange={(open) => {
          if (!open) setActiveDetailItem(null);
        }}
        onToggleRead={handleToggleRead}
        onArchive={handleArchive}
      />

      <NotificationFiltersSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        filters={data.filters}
        onApplyFilters={handleFilterChange}
        vehicles={data.authorizedVehicles}
        resultsCount={data.notifications.length}
      />

      <NotificationSettingsSheet
        open={settingsSheetOpen}
        onOpenChange={setSettingsSheetOpen}
      />

      <MarkAllReadAlert
        open={markAllAlertOpen}
        onOpenChange={setMarkAllAlertOpen}
        unreadCount={data.counts.unread}
        onConfirm={handleConfirmMarkAllRead}
        isPending={isPending}
      />
    </div>
  );
}
