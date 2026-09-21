"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@vaahansafe/ui";
import type { DashboardNotificationItem } from "@/lib/dashboard-types";

interface NotificationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: DashboardNotificationItem[];
  unreadCount: number;
}

export function NotificationSheet({
  open,
  onOpenChange,
  notifications,
  unreadCount,
}: NotificationSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-card p-4 sm:p-6">
        <SheetHeader className="border-b border-border pb-4 pr-12 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
              NOTIFICATION CENTER
            </div>
            {unreadCount > 0 && (
              <span className="rounded-full bg-[#cc785c]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#cc785c]">
                {unreadCount} UNREAD
              </span>
            )}
          </div>
          <SheetTitle className="font-serif text-xl sm:text-2xl font-medium text-foreground">
            In-App Messages
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Operational alerts, scan dispatch notices, and account security activity.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <VaahanIcon name="bell" size={24} className="mx-auto mb-2 text-muted-foreground/60" />
              <div>No notifications recorded</div>
              <p className="mt-1 text-[11px]">System and scan alerts will appear here in real-time.</p>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border bg-card">
              {notifications.map((n) => {
                const isUnread = !n.readAt;
                const isEmergency = n.priority === "CRITICAL" || n.category === "SAFETY";

                return (
                  <div key={n.id} className="p-3.5 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {isUnread && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#cc785c]" />
                        )}
                        <span className="font-mono text-xs font-bold text-foreground truncate">
                          {n.title}
                        </span>
                      </div>
                      <span
                        className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded shrink-0 ${
                          isEmergency
                            ? "bg-[#c64545]/10 text-[#c64545]"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {n.category}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">{n.bodySafe}</p>

                    <div className="font-mono text-[9px] text-muted-foreground">
                      {n.createdAt ? n.createdAt.slice(0, 16).replace("T", " ") : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
