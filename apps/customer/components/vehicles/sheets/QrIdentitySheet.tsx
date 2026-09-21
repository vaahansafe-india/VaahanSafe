"use client";

import * as React from "react";
import Link from "next/link";
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
import type { VehicleRegistryItem } from "@/lib/vehicle-types";

interface QrIdentitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: VehicleRegistryItem | null;
}

export function QrIdentitySheet({
  open,
  onOpenChange,
  vehicle,
}: QrIdentitySheetProps) {
  if (!vehicle) return null;

  const hasQr = vehicle.qr.hasQr;
  const isQrActive = vehicle.qr.status === "ACTIVE" || vehicle.qr.status === "ACTIVATED";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-card p-6 border-l border-border">
        <SheetHeader className="border-b border-border pb-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
            CRYPTOGRAPHIC QR LIFELINE
          </div>
          <SheetTitle className="font-serif text-2xl font-medium text-foreground">
            QR Safety Identity
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Authoritative physical sticker binding and safety routing status.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* QR Status Card */}
          <div className="rounded-2xl border border-border bg-muted/30 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[#cc785c]">
                  <VaahanIcon name="qr" size={20} />
                </span>
                <span className="font-mono text-sm font-bold text-foreground">
                  {vehicle.qr.publicId ? `VS-${vehicle.qr.publicId}` : "No QR Bound"}
                </span>
              </div>
              <span
                className={`rounded px-2 py-0.5 font-mono text-[10px] font-semibold uppercase ${
                  vehicle.qr.replacementPending
                    ? "bg-[#cc785c]/15 text-[#cc785c]"
                    : isQrActive
                    ? "bg-[#5db8a6]/15 text-[#5db8a6]"
                    : "bg-[#e8a55a]/15 text-[#e8a55a]"
                }`}
              >
                {vehicle.qr.replacementPending
                  ? `Replacing (${vehicle.qr.replacementStatus || "Pending"})`
                  : vehicle.qr.status}
              </span>
            </div>

            <div className="space-y-2 border-t border-border pt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Linked Vehicle</span>
                <span className="font-medium text-foreground">
                  {vehicle.make} {vehicle.model} ({vehicle.registrationNumber})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assignment Status</span>
                <span className="font-mono text-foreground">
                  {hasQr ? "Bound to Asset" : "Pending Attachment"}
                </span>
              </div>
              {vehicle.qr.assignedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bound On</span>
                  <span className="font-mono text-foreground">
                    {new Date(vehicle.qr.assignedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Pathways */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Available Lifecycle Actions
            </h4>

            {!hasQr ? (
              <>
                <Link
                  href={`/qr/activate?vehicleId=${vehicle.id}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5 transition-all hover:border-[#cc785c]/40 hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#cc785c]/10 text-[#cc785c]">
                      <VaahanIcon name="qr-scan" size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        Activate Retail QR
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Link a purchased physical sticker pack
                      </div>
                    </div>
                  </div>
                  <VaahanIcon name="arrow-right" size={14} className="text-muted-foreground" />
                </Link>

                <Link
                  href="/qr/buy"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5 transition-all hover:border-[#cc785c]/40 hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#cc785c]/10 text-[#cc785c]">
                      <VaahanIcon name="cart" size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        Order QR Sticker Kit
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Order tamper-evident windshield sticker
                      </div>
                    </div>
                  </div>
                  <VaahanIcon name="arrow-right" size={14} className="text-muted-foreground" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/qr/digital"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5 transition-all hover:border-[#cc785c]/40 hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#cc785c]/10 text-[#cc785c]">
                      <VaahanIcon name="phone" size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        View Digital QR Pass
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Save to smartphone wallet or digital screen
                      </div>
                    </div>
                  </div>
                  <VaahanIcon name="arrow-right" size={14} className="text-muted-foreground" />
                </Link>

                <Link
                  href={`/qr/replace?vehicleId=${vehicle.id}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5 transition-all hover:border-[#cc785c]/40 hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#cc785c]/10 text-[#cc785c]">
                      <VaahanIcon name="refresh" size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        Request Replacement Sticker
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        For damaged, faded, or peeled physical stickers
                      </div>
                    </div>
                  </div>
                  <VaahanIcon name="arrow-right" size={14} className="text-muted-foreground" />
                </Link>
              </>
            )}
          </div>
        </div>

        <SheetFooter className="mt-8 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
