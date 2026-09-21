"use client";

import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

interface BulkNotificationActionsProps {
  selectedCount: number;
  onMarkRead: () => void;
  onMarkUnread: () => void;
  onArchive: () => void;
  onClearSelection: () => void;
  isPending?: boolean;
}

export function BulkNotificationActions({
  selectedCount,
  onMarkRead,
  onMarkUnread,
  onArchive,
  onClearSelection,
  isPending = false,
}: BulkNotificationActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <>
      {/* Desktop inline bulk action bar */}
      <div className="hidden sm:flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-[#cc785c]/40 bg-[#cc785c]/5 px-4 py-2.5 shadow-2xs animate-in fade-in slide-in-from-top-1 duration-150 min-w-0 w-full">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#cc785c] text-[10px] font-bold text-white shrink-0">
            {selectedCount}
          </span>
          <span className="font-mono text-xs font-semibold text-foreground">
            {selectedCount} {selectedCount === 1 ? "notification" : "notifications"} selected
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onMarkRead}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 font-mono text-xs font-semibold text-foreground transition-colors hover:border-[#cc785c] hover:text-[#cc785c] disabled:opacity-50"
          >
            <VaahanIcon name="check" size={12} />
            <span>Mark as Read</span>
          </button>

          <button
            type="button"
            onClick={onMarkUnread}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 font-mono text-xs font-semibold text-foreground transition-colors hover:border-[#cc785c] hover:text-[#cc785c] disabled:opacity-50"
          >
            <VaahanIcon name="eye" size={12} />
            <span>Mark as Unread</span>
          </button>

          <button
            type="button"
            onClick={onArchive}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 font-mono text-xs font-semibold text-foreground transition-colors hover:border-[#cc785c] hover:text-[#cc785c] disabled:opacity-50"
          >
            <VaahanIcon name="document" size={12} />
            <span>Archive</span>
          </button>

          <button
            type="button"
            onClick={onClearSelection}
            className="ml-2 font-mono text-xs text-muted-foreground hover:text-foreground underline"
          >
            Deselect
          </button>
        </div>
      </div>

      {/* Mobile sticky bottom floating triage rail */}
      <div className="sm:hidden fixed bottom-4 left-4 right-4 z-40 flex items-center justify-between rounded-2xl border border-border bg-card/95 backdrop-blur-md p-3 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#cc785c] text-[10px] font-bold text-white">
            {selectedCount}
          </span>
          <span className="font-mono text-xs font-bold text-foreground">
            Selected
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onMarkRead}
            disabled={isPending}
            className="flex h-8 px-2.5 items-center justify-center rounded-xl bg-[#cc785c] font-mono text-[11px] font-semibold text-white transition-colors hover:bg-[#a9583e] disabled:opacity-50"
          >
            Read
          </button>

          <button
            type="button"
            onClick={onArchive}
            disabled={isPending}
            className="flex h-8 px-2.5 items-center justify-center rounded-xl border border-border bg-background font-mono text-[11px] font-semibold text-foreground transition-colors hover:border-[#cc785c] disabled:opacity-50"
          >
            Archive
          </button>

          <button
            type="button"
            onClick={onClearSelection}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground"
            aria-label="Deselect all"
          >
            <VaahanIcon name="close" size={12} />
          </button>
        </div>
      </div>
    </>
  );
}
