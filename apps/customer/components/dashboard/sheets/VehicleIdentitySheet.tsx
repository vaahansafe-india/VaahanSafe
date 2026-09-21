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
} from "@vaahansafe/ui";
import type { DashboardVehicle, DashboardQrSticker } from "@/lib/dashboard-types";

interface VehicleIdentitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: DashboardVehicle | null;
  qrSticker: DashboardQrSticker | null;
}

export function VehicleIdentitySheet({
  open,
  onOpenChange,
  vehicle,
  qrSticker,
}: VehicleIdentitySheetProps) {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  if (!vehicle) return null;

  const handleCopy = (text: string, key: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // Derive dynamic vehicle icon
  const vehicleIconName = (() => {
    const type = vehicle.type?.toLowerCase() || "";
    if (
      type.includes("motorcycle") ||
      type.includes("bike") ||
      type.includes("scooter") ||
      type.includes("two_wheeler") ||
      type.includes("two wheeler")
    ) {
      return "motorcycle" as const;
    }
    if (type.includes("truck")) return "truck" as const;
    if (type.includes("bus")) return "bus" as const;
    return "vehicle" as const;
  })();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-card p-4 sm:p-6">
        <SheetHeader className="border-b border-border pb-4 pr-12 text-left">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
            VEHICLE IDENTITY DETAIL
          </div>
          <SheetTitle className="font-serif text-2xl font-medium text-foreground">
            {vehicle.registrationNumber}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Official identity registration records for this vehicle.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Identity Card */}
          <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-muted/30 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#cc785c]/10 text-[#cc785c] ring-1 ring-[#cc785c]/20">
                  <VaahanIcon name={vehicleIconName} size={22} />
                </div>
                <div>
                  <div className="font-mono text-sm font-bold text-foreground">
                    {vehicle.make} {vehicle.model}
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground mt-0.5">
                    Class: {vehicle.type} &bull; Status: {vehicle.status}
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#5db8a6]/30 bg-[#5db8a6]/10 px-2.5 py-1 font-mono text-[10px] font-bold text-[#5db8a6] uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5db8a6]" />
                Registered
              </span>
            </div>
          </div>

          {/* Technical Specs & IDs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              <span>IDENTITY SPECIFICATION</span>
              <span className="text-[9px]">D1 Authoritative</span>
            </div>

            <div className="divide-y divide-border rounded-2xl border border-border bg-card text-xs overflow-hidden">
              <div className="flex items-center justify-between p-3.5">
                <div>
                  <div className="font-medium text-foreground">Internal Reference</div>
                  <div className="font-mono text-[10px] text-muted-foreground">Primary identity key</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[130px] sm:max-w-[170px]">
                    {vehicle.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(vehicle.id, "vehicleId")}
                    title="Copy Vehicle ID"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-muted/20 text-muted-foreground transition-colors hover:border-[#cc785c]/60 hover:text-foreground active:scale-95"
                  >
                    {copiedKey === "vehicleId" ? (
                      <VaahanIcon name="check" size={13} className="text-[#5db8a6]" />
                    ) : (
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <div>
                  <div className="font-medium text-foreground">Registration Number</div>
                  <div className="font-mono text-[10px] text-muted-foreground">Official RTO plate</div>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="rounded bg-muted/60 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    IND
                  </span>
                  <span className="font-bold text-base tracking-wider text-foreground">
                    {vehicle.registrationNumber}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <div>
                  <div className="font-medium text-foreground">Linked QR Identity</div>
                  <div className="font-mono text-[10px] text-muted-foreground">Physical sticker badge</div>
                </div>
                <span className="font-mono font-bold text-[#cc785c]">
                  {qrSticker ? qrSticker.visibleCode : "No sticker bound"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <div>
                  <div className="font-medium text-foreground">Registered On</div>
                  <div className="font-mono text-[10px] text-muted-foreground">First record timestamp</div>
                </div>
                <span className="font-mono text-foreground">
                  {vehicle.createdAt ? vehicle.createdAt.slice(0, 10) : "Recorded"}
                </span>
              </div>
            </div>
          </div>

          {/* Topological Relationship */}
          <div className="space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              TOPOLOGICAL RELATIONSHIP
            </div>
            <div className="rounded-2xl border border-border bg-muted/15 p-4 font-mono text-xs text-foreground space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[#cc785c]">&bull;</span>
                <span>VEHICLE: {vehicle.registrationNumber}</span>
              </div>
              <div className="text-muted-foreground pl-3 flex items-center gap-1.5">
                <span>&darr;</span>
                <span className="text-[10px]">IDENTITY RECORD</span>
              </div>
              <div className="pl-5 flex items-center gap-2">
                <span className="text-[#cc785c]">&bull;</span>
                <span>QR STICKER: {qrSticker ? qrSticker.visibleCode : "UNLINKED"}</span>
              </div>
              <div className="text-muted-foreground pl-7 flex items-center gap-1.5">
                <span>&darr;</span>
                <span className="text-[10px]">PUBLIC PROJECTION</span>
              </div>
              <div className="pl-9 flex items-center gap-2 text-[#5db8a6]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5db8a6]" />
                <span className="font-bold">SAFETY VIEW READY</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5 pt-4 border-t border-border">
            <Link
              href="/vehicles"
              onClick={() => onOpenChange(false)}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#cc785c] py-3 font-mono text-xs font-semibold text-white shadow-sm shadow-[#cc785c]/25 transition-all hover:bg-[#a9583e] active:scale-[0.99]"
            >
              <span>Manage Vehicles in Fleet</span>
              <VaahanIcon name="arrow-right" size={13} />
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
