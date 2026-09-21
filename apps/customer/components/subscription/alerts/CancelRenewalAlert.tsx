"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@vaahansafe/ui";
import { VaahanIcon } from "@vaahansafe/icons";
import type { ActiveSubscriptionPassport, ConnectedVehicleServiceItem } from "@/lib/subscription-types";

interface CancelRenewalAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passport: ActiveSubscriptionPassport;
  vehicles: ConnectedVehicleServiceItem[];
  onConfirm: () => void;
  isLoading?: boolean;
}

export function CancelRenewalAlert({
  open,
  onOpenChange,
  passport,
  vehicles,
  onConfirm,
  isLoading,
}: CancelRenewalAlertProps) {
  const formatDate = (isoString?: string) => {
    if (!isoString) return "the end of the current term";
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-full sm:max-w-md bg-card p-6 border-border">
        <AlertDialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-2 text-[#e8a55a]">
            <VaahanIcon name="warning" size={18} />
            <span className="font-mono text-xs uppercase tracking-wider font-bold">
              Confirm Renewal Modification
            </span>
          </div>

          <AlertDialogTitle className="font-serif text-2xl font-medium text-foreground">
            Cancel Automatic Renewal?
          </AlertDialogTitle>

          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Review the authoritative consequences before disabling scheduled billing.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 space-y-3 rounded-xl border border-border bg-background p-4 text-xs">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
              What Will Change
            </span>
            <p className="mt-1 text-foreground">
              Automatic renewal charges will cease. Your subscription status will transition to{" "}
              <strong className="font-mono">CANCEL_AT_PERIOD_END</strong>.
            </p>
          </div>

          <div className="border-t border-border/70 pt-2.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
              Effective Date
            </span>
            <p className="mt-1 font-mono font-bold text-foreground">
              {formatDate(passport.termEnd)}
            </p>
          </div>

          <div className="border-t border-border/70 pt-2.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
              Affected Vehicles ({vehicles.length})
            </span>
            <p className="mt-1 text-muted-foreground">
              {vehicles.map((v) => v.registrationNumber).join(", ") || "All registered vehicles"}
            </p>
          </div>

          <div className="border-t border-border/70 pt-2.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#5db8a6] block font-bold">
              Life-Safety Invariant Guarantee
            </span>
            <p className="mt-1 text-muted-foreground text-[11px] leading-relaxed">
              Your physical QR sticker will NOT be deactivated. Emergency profile resolution and verified contact calling remain permanently enabled under Core Safety Continuity.
            </p>
          </div>
        </div>

        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <AlertDialogCancel className="font-mono text-xs">
            Keep Auto-Renewal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className="bg-[#cc785c] hover:bg-[#a9583e] text-white font-mono text-xs font-semibold uppercase tracking-wider"
          >
            {isLoading ? "Updating..." : "Confirm Cancellation"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
