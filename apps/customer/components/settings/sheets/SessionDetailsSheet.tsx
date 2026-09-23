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
      <SheetContent side="right" className="w-full sm:max-w-md p-5 sm:p-6 space-y-6 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-6">
          <SheetHeader className="text-left space-y-3 pr-14 sm:pr-16">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#cc785c]/10 text-[#cc785c] border border-[#cc785c]/25 shrink-0 shadow-2xs">
                <VaahanIcon
                  name={
                    session.browser.toLowerCase().includes("chrome") ||
                    session.browser.toLowerCase().includes("crios")
                      ? "chrome"
                      : session.browser.toLowerCase().includes("safari")
                      ? "safari"
                      : session.deviceType === "mobile"
                      ? "mobile"
                      : "browser"
                  }
                  size={24}
                />
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-md bg-background border border-border/80 shadow-2xs text-muted-foreground">
                  <VaahanIcon
                    name={
                      session.os.toLowerCase().includes("win")
                        ? "windows"
                        : session.os.toLowerCase().includes("mac") || session.os.toLowerCase().includes("ios")
                        ? "apple"
                        : session.os.toLowerCase().includes("android")
                        ? "android"
                        : session.deviceType === "mobile"
                        ? "mobile"
                        : "laptop"
                    }
                    size={11}
                  />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <SheetTitle className="font-serif text-lg font-medium text-foreground tracking-tight leading-snug">
                    {session.browser}
                  </SheetTitle>
                  <SettingStatus status={session.isCurrent ? "CURRENT" : "ACTIVE"} />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono mt-0.5">
                  <span>{session.os}</span>
                  <span>&bull;</span>
                  <span>{session.isCurrent ? "Active now" : "Remote session"}</span>
                </div>
              </div>
            </div>
            <SheetDescription className="text-xs text-muted-foreground pt-0.5 leading-relaxed">
              Cryptographically verified RFC 6265 HttpOnly session token registered in Cloudflare D1.
            </SheetDescription>
          </SheetHeader>

          {/* Details list */}
          <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3.5 divide-y divide-border/40">
            <div className="flex items-center justify-between pt-1 gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Session Status</span>
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${session.isCurrent ? "bg-emerald-500 animate-pulse" : "bg-teal-500"}`} />
                <span className="font-mono text-xs text-foreground font-medium text-right">
                  {session.isCurrent ? "Active on this device" : "Active on remote device"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Operating System</span>
              <span className="font-mono text-xs text-foreground text-right">
                {session.os}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Browser Family</span>
              <span className="font-mono text-xs text-foreground text-right">
                {session.browser}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Last Activity</span>
              <span className="font-mono text-xs text-foreground text-right">
                {formatDate(session.lastSeenAt)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Signed In On</span>
              <span className="font-mono text-xs text-foreground text-right">
                {formatDate(session.createdAt)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Network Route</span>
              <span className="font-mono text-xs text-muted-foreground text-right">
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
              className="w-full h-10 rounded-xl font-medium shadow-xs text-xs sm:text-sm"
            >
              Sign Out This Device
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="w-full h-10 rounded-xl font-medium shadow-xs text-xs sm:text-sm"
            >
              Close
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
