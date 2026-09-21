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
import type { ActiveSubscriptionPassport, ConnectedVehicleServiceItem, ServiceCapabilityItem } from "@/lib/subscription-types";

interface PlanDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passport: ActiveSubscriptionPassport;
  vehicles: ConnectedVehicleServiceItem[];
  capabilities: ServiceCapabilityItem[];
  onManagePlan?: () => void;
  onExplorePlans?: () => void;
}

export function PlanDetailsSheet({
  open,
  onOpenChange,
  passport,
  vehicles,
  capabilities,
  onManagePlan,
  onExplorePlans,
}: PlanDetailsSheetProps) {
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
            Service Plan Specifications
          </div>
          <SheetTitle className="font-serif text-2xl font-medium text-foreground">
            {passport.planName}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Authoritative commercial entitlement rules and vehicle capacity.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status Banner */}
          <div className="rounded-xl border border-border bg-background p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                Current Status
              </span>
              <Badge
                variant="outline"
                className={`font-mono text-[10px] font-semibold transition-colors ${
                  passport.status === "ACTIVE" || passport.isBaselineContinuity
                    ? "border-[#5db8a6]/40 bg-[#5db8a6]/10 text-[#5db8a6] hover:bg-[#5db8a6]/15 hover:text-[#5db8a6]"
                    : "border-border bg-muted text-muted-foreground hover:bg-muted"
                }`}
              >
                {passport.statusLabel}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {passport.isBaselineContinuity
                ? "Operating under life-safety continuity. Baseline QR emergency profile resolution and contact calling remain permanently active."
                : "Active commercial subscription with auto-renewal enabled."}
            </p>
          </div>

          {/* Allocation Details */}
          <div className="space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Capacity & Entitlements
            </div>
            <div className="divide-y divide-border rounded-xl border border-border bg-background text-xs">
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Vehicle Capacity</span>
                <span className="font-mono font-bold text-foreground">
                  {passport.coveredVehiclesCount} / {passport.vehicleLimit} Slots Used
                </span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Verified Emergency Contacts</span>
                <span className="font-mono font-bold text-foreground">
                  Up to {passport.contactLimit} Contacts
                </span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Term Commencement</span>
                <span className="font-mono text-foreground">
                  {passport.termStart ? formatDate(passport.termStart) : "Perpetual Baseline"}
                </span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Term End / Renewal</span>
                <span className="font-mono font-bold text-foreground">
                  {passport.termEnd ? formatDate(passport.termEnd) : "Indefinite"}
                </span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Auto-Renewal</span>
                <span className="font-mono text-foreground">
                  {passport.autoRenew ? "Enabled" : "Disabled / Baseline"}
                </span>
              </div>
            </div>
          </div>

          {/* Connected Vehicles */}
          <div className="space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Connected Vehicle Identities ({vehicles.length})
            </div>
            <div className="space-y-2">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-background text-xs"
                >
                  <div>
                    <div className="font-mono font-bold text-foreground">
                      {v.registrationNumber}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {v.make} {v.model} • {v.qr ? v.qr.visibleCode : "No QR"}
                    </div>
                  </div>
                  <Badge className="border-[#5db8a6]/40 bg-[#5db8a6]/10 text-[#5db8a6] font-mono text-[9px]">
                    CONNECTED
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Enabled Capabilities */}
          <div className="space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Included Capabilities
            </div>
            <div className="space-y-1.5">
              {capabilities.map((cap) => (
                <div
                  key={cap.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-background text-xs"
                >
                  <div className="flex items-center gap-2">
                    <VaahanIcon name={cap.iconName} size={14} className="text-[#cc785c]" />
                    <span className="font-mono font-medium text-foreground">{cap.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#5db8a6] font-semibold">
                    {cap.status === "ENABLED" ? "ENABLED" : cap.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-border flex flex-col gap-2">
            {passport.hasSubscription && onManagePlan && (
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onManagePlan();
                }}
                className="w-full flex h-10 items-center justify-center gap-2 rounded-xl bg-[#cc785c] px-4 font-mono text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#a9583e] transition-colors"
              >
                <VaahanIcon name="settings" size={13} />
                <span>Manage Subscription</span>
              </button>
            )}
            {onExplorePlans && (
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onExplorePlans();
                }}
                className="w-full flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 font-mono text-xs font-semibold text-foreground hover:bg-muted transition-colors"
              >
                <VaahanIcon name="shield" size={13} />
                <span>Explore All Plans</span>
              </button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
