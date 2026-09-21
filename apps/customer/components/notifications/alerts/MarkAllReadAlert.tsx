"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@vaahansafe/ui";

interface MarkAllReadAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unreadCount: number;
  onConfirm: () => void;
  isPending?: boolean;
}

export function MarkAllReadAlert({
  open,
  onOpenChange,
  unreadCount,
  onConfirm,
  isPending = false,
}: MarkAllReadAlertProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-3xl p-6 bg-card text-foreground max-w-md">
        <AlertDialogHeader className="text-left space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
            Inbox Triage
          </span>
          <AlertDialogTitle className="font-serif text-2xl font-medium text-foreground">
            Mark all notifications as read?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
            This will mark all <strong className="text-foreground">{unreadCount}</strong> unread notifications in your current inbox as read. You can still access them at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4 gap-2">
          <AlertDialogCancel
            disabled={isPending}
            className="rounded-xl border border-border bg-background px-4 py-2 font-mono text-xs font-semibold"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-xl bg-[#cc785c] px-4 py-2 font-mono text-xs font-semibold text-white transition-colors hover:bg-[#a9583e]"
          >
            {isPending ? "Updating..." : "Mark All as Read"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
