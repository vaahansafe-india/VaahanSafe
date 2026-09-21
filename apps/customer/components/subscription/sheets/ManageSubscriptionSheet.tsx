"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Badge,
} from "@vaahansafe/ui";
import type { ActiveSubscriptionPassport, CommercialPlanItem } from "@/lib/subscription-types";

interface ManageSubscriptionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passport: ActiveSubscriptionPassport;
  availablePlans: CommercialPlanItem[];
  onRequestCancelRenewal: () => void;
  onEnableRenewal: () => void;
  onExplorePlans: () => void;
  isUpdating?: boolean;
}

export function ManageSubscriptionSheet({
  open,
  onOpenChange,
  passport,
  availablePlans,
  onRequestCancelRenewal,
  onEnableRenewal,
  onExplorePlans,
  isUpdating,
}: ManageSubscriptionSheetProps) {
  const formatDate = (isoString?: string) => {
    if (!isoString) return "—";
    try {
      return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-card p-4 sm:p-6">
        <SheetHeader className="border-b border-border pb-4 pr-12 text-left">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
            Subscription Management
          </div>
          <SheetTitle className="font-serif text-2xl font-medium text-foreground">
            Manage Service
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Update renewal preferences, view billing schedules, or change plan.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Current Status Overview */}
          <div className="rounded-xl border border-border bg-background p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-foreground">
                {passport.planName}
              </span>
              <Badge variant="outline" className="border-[#5db8a6]/40 bg-[#5db8a6]/10 text-[#5db8a6] hover:bg-[#5db8a6]/15 hover:text-[#5db8a6] font-mono text-[10px]">
                {passport.status}
              </Badge>
            </div>

            <div className="text-xs text-muted-foreground space-y-1 divide-y divide-border/60">
              <div className="flex justify-between py-1.5">
                <span>Current Term Ends</span>
                <span className="font-mono font-bold text-foreground">
                  {formatDate(passport.termEnd)}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span>Auto-Renewal Status</span>
                <span className="font-mono font-bold text-foreground">
                  {passport.cancelAtPeriodEnd ? "Scheduled to Conclude" : "Active Auto-Renewal"}
                </span>
              </div>
            </div>
          </div>

          {/* Renewal Preference Controls */}
          <div className="space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Renewal Controls
            </div>

            {passport.cancelAtPeriodEnd ? (
              <div className="rounded-xl border border-[#e8a55a]/40 bg-[#e8a55a]/[0.05] p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <VaahanIcon name="warning" size={16} className="text-[#e8a55a] shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    Your subscription is set to conclude on <strong className="text-foreground">{formatDate(passport.termEnd)}</strong>. Advanced telematics and scan history will pause after this date.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onEnableRenewal}
                  disabled={isUpdating}
                  className="w-full inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#5db8a6] px-3 font-mono text-xs font-semibold text-white hover:bg-[#4ea896] transition-colors"
                >
                  <VaahanIcon name="check" size={13} />
                  <span>{isUpdating ? "Updating..." : "Resume Auto-Renewal"}</span>
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-background p-4 space-y-3">
                <div className="text-xs text-muted-foreground leading-relaxed">
                  Your plan is scheduled to automatically renew at the end of the term. You can opt to disable automatic renewal at any time.
                </div>
                <button
                  type="button"
                  onClick={onRequestCancelRenewal}
                  disabled={isUpdating}
                  className="w-full inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 font-mono text-xs font-medium text-muted-foreground hover:text-[#c64545] hover:border-[#c64545]/40 transition-colors"
                >
                  <VaahanIcon name="close" size={13} />
                  <span>Cancel Automatic Renewal</span>
                </button>
              </div>
            )}
          </div>

          {/* Change Plan / Tiers */}
          <div className="space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Commercial Tier
            </div>
            <div className="rounded-xl border border-border bg-background p-4 space-y-3">
              <div className="text-xs text-muted-foreground">
                Looking to expand emergency contact limits or cover multi-vehicle fleets under a single billing identity?
              </div>
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onExplorePlans();
                }}
                className="w-full inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 font-mono text-xs font-bold text-foreground hover:bg-muted transition-colors"
              >
                <VaahanIcon name="shield" size={13} className="text-[#cc785c]" />
                <span>View Tier Upgrades</span>
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
