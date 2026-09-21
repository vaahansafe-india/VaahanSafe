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
import type { ServiceCapabilityItem } from "@/lib/subscription-types";

interface ServiceDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  capability: ServiceCapabilityItem | null;
  onAction?: () => void;
}

export function ServiceDetailsSheet({
  open,
  onOpenChange,
  capability,
  onAction,
}: ServiceDetailsSheetProps) {
  if (!capability) return null;

  const isEnabled = capability.status === "ENABLED";
  const isBaseline = capability.status === "BASELINE";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-card p-4 sm:p-6">
        <SheetHeader className="border-b border-border pb-4 pr-12 text-left">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
            Capability Specification
          </div>
          <SheetTitle className="font-serif text-2xl font-medium text-foreground">
            {capability.name}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Authoritative entitlement state and operational dispatch rules.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status & Scope */}
          <div className="rounded-xl border border-border bg-background p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                Entitlement State
              </span>
              <Badge
                variant="outline"
                className={`font-mono text-[10px] font-semibold transition-colors ${
                  isEnabled
                    ? "border-[#5db8a6]/40 bg-[#5db8a6]/10 text-[#5db8a6] hover:bg-[#5db8a6]/15 hover:text-[#5db8a6]"
                    : isBaseline
                    ? "border-[#cc785c]/40 bg-[#cc785c]/10 text-[#cc785c] hover:bg-[#cc785c]/15 hover:text-[#cc785c]"
                    : "border-border bg-muted text-muted-foreground hover:bg-muted"
                }`}
              >
                {capability.statusLabel}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {capability.description}
            </p>
          </div>

          {/* Operational Ledger Specs */}
          <div className="space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Technical Details
            </div>
            <div className="divide-y divide-border rounded-xl border border-border bg-background text-xs">
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Functional Category</span>
                <span className="font-mono font-bold text-foreground">
                  {capability.category}
                </span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Bound Vehicle Identity</span>
                <span className="font-mono font-bold text-foreground">
                  {capability.boundVehiclePlate || "All Registered Vehicles"}
                </span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Commercial Prerequisite</span>
                <span className="font-mono text-foreground">
                  {capability.requiresPlan ? "Active Commercial Subscription" : "Sticker Hardware Purchase"}
                </span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Security Source</span>
                <span className="font-mono text-[#5db8a6] font-semibold">
                  Server-Verified Entitlement
                </span>
              </div>
            </div>
          </div>

          {/* Life-Safety Note */}
          <div className="rounded-xl border border-[#5db8a6]/30 bg-[#5db8a6]/[0.05] p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 font-mono text-xs text-[#5db8a6] font-bold">
              <VaahanIcon name="shield" size={13} />
              <span>Safety Continuity Invariant</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All physical QR stickers permanently resolve emergency calling and safety instructions regardless of subscription renewal status.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
