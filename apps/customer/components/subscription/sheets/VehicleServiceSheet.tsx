"use client";

import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Badge,
} from "@vaahansafe/ui";
import type { ConnectedVehicleServiceItem } from "@/lib/subscription-types";

interface VehicleServiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: ConnectedVehicleServiceItem | null;
}

export function VehicleServiceSheet({
  open,
  onOpenChange,
  vehicle,
}: VehicleServiceSheetProps) {
  if (!vehicle) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-card p-4 sm:p-6">
        <SheetHeader className="border-b border-border pb-4 pr-12 text-left">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
            Vehicle Service Attachment
          </div>
          <SheetTitle className="font-serif text-2xl font-medium text-foreground">
            {vehicle.registrationNumber}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {vehicle.make} {vehicle.model} • Active service state
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Identity Attachment Card */}
          <div className="rounded-xl border border-border bg-background p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                QR Hardware Identity
              </span>
              <Badge
                variant="outline"
                className={`font-mono text-[10px] font-semibold transition-colors ${
                  vehicle.qr?.status === "ACTIVATED"
                    ? "border-[#5db8a6]/40 bg-[#5db8a6]/10 text-[#5db8a6] hover:bg-[#5db8a6]/15 hover:text-[#5db8a6]"
                    : "border-border bg-muted text-muted-foreground hover:bg-muted"
                }`}
              >
                {vehicle.qr ? vehicle.qr.status : "UNBOUND"}
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="font-mono text-base font-bold text-foreground">
                {vehicle.qr ? vehicle.qr.visibleCode : "No QR Sticker Assigned"}
              </div>
              <div className="text-xs text-muted-foreground">
                {vehicle.qr?.activatedAt
                  ? `Activated on ${new Date(vehicle.qr.activatedAt).toLocaleDateString("en-IN")}`
                  : "Sticker pairing required for physical resolution."}
              </div>
            </div>
          </div>

          {/* Service Specifications */}
          <div className="space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Connected Service State
            </div>
            <div className="divide-y divide-border rounded-xl border border-border bg-background text-xs">
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Plan Attachment</span>
                <span className="font-mono font-bold text-foreground">
                  {vehicle.planName || "Core Safety Baseline"}
                </span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Service Status</span>
                <span className="font-mono font-bold text-[#5db8a6]">
                  {vehicle.subscriptionStatus}
                </span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Active Entitlements</span>
                <span className="font-mono text-foreground">
                  {vehicle.entitlementsCount} Granted
                </span>
              </div>
            </div>
          </div>

          {/* Direct Actions */}
          <div className="space-y-2 pt-2 border-t border-border">
            <Link
              href="/qr"
              className="w-full flex h-10 items-center justify-center gap-2 rounded-xl bg-[#cc785c] px-4 font-mono text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#a9583e] transition-colors"
            >
              <VaahanIcon name="qr" size={13} />
              <span>View QR Details</span>
            </Link>
            <Link
              href="/vehicles"
              className="w-full flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 font-mono text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <VaahanIcon name="vehicle" size={13} />
              <span>Manage Vehicle Profile</span>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
