"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  Button,
} from "@vaahansafe/ui";
import { VaahanIcon } from "@vaahansafe/icons";
import type { SessionItem } from "@/lib/settings-types";
import { SettingStatus } from "../primitives/SettingStatus";

interface SessionDetailsSheetProps {
  session: SessionItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRevokeClick: (session: SessionItem) => void;
}

export function SessionDetailsSheet({
  session,
  open,
  onOpenChange,
  onRevokeClick,
}: SessionDetailsSheetProps) {
  if (!session) return null;

  const formatDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md p-6 space-y-6 flex flex-col justify-between">
        <div className="space-y-6">
          <SheetHeader className="text-left space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5db8a6]/10 text-[#5db8a6]">
                  <VaahanIcon
                    name={session.deviceType === "mobile" ? "phone" : "laptop"}
                    size={18}
                  />
                </div>
                <div>
                  <SheetTitle className="font-serif text-lg font-medium text-foreground">
                    {session.browser}
                  </SheetTitle>
                  <p className="text-xs text-muted-foreground">{session.os}</p>
                </div>
              </div>
              <SettingStatus status={session.isCurrent ? "CURRENT" : "ACTIVE"} />
            </div>
            <SheetDescription className="text-xs text-muted-foreground pt-1">
              Cryptographically verified RFC 6265 HttpOnly session token registered in Cloudflare D1.
            </SheetDescription>
          </SheetHeader>

          {/* Details list */}
          <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3.5 divide-y divide-border/40">
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">Session Status</span>
              <span className="font-mono text-xs text-foreground font-medium">
                {session.isCurrent ? "Active on this device" : "Active on remote device"}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-xs text-muted-foreground">Operating System</span>
              <span className="font-mono text-xs text-foreground">
                {session.os}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-xs text-muted-foreground">Browser Family</span>
              <span className="font-mono text-xs text-foreground">
                {session.browser}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-xs text-muted-foreground">Last Activity</span>
              <span className="font-mono text-xs text-foreground">
                {formatDate(session.lastSeenAt)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-xs text-muted-foreground">Signed In On</span>
              <span className="font-mono text-xs text-foreground">
                {formatDate(session.createdAt)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-xs text-muted-foreground">Network Route</span>
              <span className="font-mono text-xs text-muted-foreground">
                {session.ipAddressMasked}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-[11px] text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">Security Invariant: </span>
            Session tokens are strictly stored in server-verified HttpOnly cookies. Raw bearer secrets are never stored in browser storage.
          </div>
        </div>

        <SheetFooter className="gap-2 sm:gap-0 pt-4 border-t border-border/60">
          {!session.isCurrent ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onRevokeClick(session);
              }}
              className="w-full"
            >
              Sign Out This Device
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Close
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
