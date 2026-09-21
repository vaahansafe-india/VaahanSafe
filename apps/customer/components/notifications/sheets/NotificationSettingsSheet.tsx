"use client";

import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@vaahansafe/ui";

interface NotificationSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationSettingsSheet({
  open,
  onOpenChange,
}: NotificationSettingsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col justify-between bg-card text-foreground"
      >
        <div className="p-6 overflow-y-auto space-y-6">
          <SheetHeader className="text-left pr-14">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
              Delivery Orchestration
            </span>
            <SheetTitle className="font-serif text-2xl font-medium tracking-tight text-foreground">
              Notification Preferences
            </SheetTitle>
          </SheetHeader>

          {/* Policy Invariant Alert */}
          <div className="flex items-start gap-2.5 rounded-2xl border border-[#cc785c]/30 bg-[#cc785c]/5 p-3.5 text-xs text-foreground leading-relaxed">
            <VaahanIcon name="shield" size={14} className="text-[#cc785c] shrink-0 mt-0.5" />
            <div>
              <strong className="font-mono uppercase tracking-wider text-[#cc785c]">
                Mandatory Safety Policy:
              </strong>{" "}
              Vehicle emergency scan alerts, OTP codes, and critical account security warnings are always dispatched regardless of preferences.
            </div>
          </div>

          {/* Active Channels Overview */}
          <div className="space-y-3">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Connected Delivery Channels
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-2xl border border-border/70 bg-background/50">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#cc785c]/10 text-[#cc785c]">
                    <VaahanIcon name="notification" size={14} />
                  </div>
                  <div>
                    <div className="font-medium text-xs text-foreground">In-App Inbox</div>
                    <div className="text-[11px] text-muted-foreground">Real-time web activity center</div>
                  </div>
                </div>
                <span className="font-mono text-[10px] font-bold text-[#5db8a6]">ACTIVE</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl border border-border/70 bg-background/50">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5db8a6]/10 text-[#5db8a6]">
                    <VaahanIcon name="phone" size={14} />
                  </div>
                  <div>
                    <div className="font-medium text-xs text-foreground">WhatsApp Emergency Alerts</div>
                    <div className="text-[11px] text-muted-foreground">MSG91 verified gateway</div>
                  </div>
                </div>
                <span className="font-mono text-[10px] font-bold text-[#5db8a6]">ACTIVE</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl border border-border/70 bg-background/50">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
                    <VaahanIcon name="mail" size={14} />
                  </div>
                  <div>
                    <div className="font-medium text-xs text-foreground">Email Summaries</div>
                    <div className="text-[11px] text-muted-foreground">Order receipts and safety digests</div>
                  </div>
                </div>
                <span className="font-mono text-[10px] font-bold text-[#5db8a6]">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border/70 bg-card/80 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border border-border bg-background px-4 py-2 font-mono text-xs font-semibold text-foreground transition-colors hover:bg-muted/40"
          >
            Done
          </button>

          <a
            href="/settings"
            className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#cc785c] hover:underline"
          >
            <span>Advanced Account Settings</span>
            <VaahanIcon name="arrow-right" size={11} />
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
