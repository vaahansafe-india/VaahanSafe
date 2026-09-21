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
import type { DashboardQrSticker, DashboardVehicle } from "@/lib/dashboard-types";

interface QrIdentitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrSticker: DashboardQrSticker | null;
  vehicle: DashboardVehicle | null;
  onRequestReplacement: () => void;
}

export function QrIdentitySheet({
  open,
  onOpenChange,
  qrSticker,
  vehicle,
  onRequestReplacement,
}: QrIdentitySheetProps) {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-card p-4 sm:p-6">
        <SheetHeader className="border-b border-border pb-4 pr-12 text-left">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
            QR STICKER IDENTITY
          </div>
          <SheetTitle className="font-serif text-2xl font-medium text-foreground">
            {qrSticker ? qrSticker.visibleCode : "No QR Bound"}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Cryptographic physical QR sticker bound to vehicle {vehicle?.registrationNumber}.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {qrSticker ? (
            <>
              {/* QR Status Card */}
              <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-muted/30 p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#cc785c]/10 text-[#cc785c] ring-1 ring-[#cc785c]/20">
                      <VaahanIcon name="qr" size={22} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-mono text-sm font-bold tracking-wider text-foreground">
                        {qrSticker.visibleCode}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground mt-0.5 truncate">
                        Batch: <span className="text-foreground/70">{qrSticker.batchId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {(() => {
                      const isQrActive = qrSticker.status === "ACTIVE" || qrSticker.status === "ACTIVATED";
                      const isReplacementPending = Boolean(qrSticker.replacementPending);

                      if (isReplacementPending) {
                        return (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cc785c]/35 bg-[#cc785c]/10 px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider text-[#cc785c] uppercase">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c] animate-pulse" />
                            Replacing ({qrSticker.replacementStatus?.toLowerCase() || "requested"})
                          </span>
                        );
                      }

                      if (isQrActive) {
                        return (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#5db8a6]/35 bg-[#5db8a6]/10 px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider text-[#5db8a6] uppercase">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#5db8a6]" />
                            Active
                          </span>
                        );
                      }

                      return (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e8a55a]/35 bg-[#e8a55a]/10 px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider text-[#e8a55a] uppercase">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#e8a55a]" />
                          {qrSticker.status}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* In-Flight Replacement Alert */}
              {qrSticker.replacementPending && (
                <div className="rounded-2xl border border-[#cc785c]/30 bg-[#cc785c]/[0.035] p-4 text-xs">
                  <div className="flex items-center gap-2.5 font-mono text-xs font-bold tracking-wider uppercase text-[#cc785c]">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#cc785c]/15 text-[#cc785c]">
                      <VaahanIcon name="refresh" size={13} />
                    </span>
                    <span>Replacement In Progress ({qrSticker.replacementStatus || "REQUESTED"})</span>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                    A replacement physical sticker is currently being processed. Your current QR identity remains active and functional until the new sticker arrives and is securely bound.
                  </p>
                </div>
              )}

              {/* Technical Records */}
              <div className="space-y-3">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  <span>STICKER REGISTRY DATA</span>
                  <span className="text-[9px]">Authoritative D1 Record</span>
                </div>

                <div className="divide-y divide-border rounded-2xl border border-border bg-card text-xs overflow-hidden">
                  {/* Public QR Identity (Rule 17 compliant: Opaque identifier, never called 'slug') */}
                  <div className="flex items-center justify-between p-3.5">
                    <div>
                      <div className="font-medium text-foreground">VaahanSafe Public ID</div>
                      <div className="font-mono text-[10px] text-muted-foreground">Opaque resolver identifier</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold tracking-wider text-[#cc785c]">
                        {qrSticker.publicId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(qrSticker.publicId, "publicId")}
                        title="Copy Public ID"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-muted/20 text-muted-foreground transition-colors hover:border-[#cc785c]/60 hover:text-foreground active:scale-95"
                      >
                        {copiedKey === "publicId" ? (
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

                  {/* Public Resolver Endpoint */}
                  <div className="flex items-center justify-between p-3.5">
                    <div>
                      <div className="font-medium text-foreground">Resolver Endpoint</div>
                      <div className="font-mono text-[10px] text-muted-foreground">Public scan destination</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-muted-foreground max-w-[140px] truncate sm:max-w-none">
                        qr.vaahansafe.com/{qrSticker.publicId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(`https://qr.vaahansafe.com/${qrSticker.publicId}`, "resolverUrl")}
                        title="Copy Resolver URL"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-muted/20 text-muted-foreground transition-colors hover:border-[#cc785c]/60 hover:text-foreground active:scale-95"
                      >
                        {copiedKey === "resolverUrl" ? (
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

                  {/* Hardware Asset Reference */}
                  <div className="flex items-center justify-between p-3.5">
                    <div>
                      <div className="font-medium text-foreground">Hardware Asset Ref</div>
                      <div className="font-mono text-[10px] text-muted-foreground">Internal registry token</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[130px] sm:max-w-[160px]">
                        {qrSticker.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(qrSticker.id, "id")}
                        title="Copy Asset Ref"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-muted/20 text-muted-foreground transition-colors hover:border-[#cc785c]/60 hover:text-foreground active:scale-95"
                      >
                        {copiedKey === "id" ? (
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

                  {/* Activation Status */}
                  <div className="flex items-center justify-between p-3.5">
                    <div>
                      <div className="font-medium text-foreground">Activation Status</div>
                      <div className="font-mono text-[10px] text-muted-foreground">Cryptographic timestamp</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-foreground">
                        {qrSticker.activatedAt ? qrSticker.activatedAt.slice(0, 10) : "Pending"}
                      </span>
                      {qrSticker.activatedAt && (
                        <span className="inline-flex items-center gap-1 rounded bg-[#5db8a6]/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#5db8a6]">
                          VERIFIED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Assigned Vehicle */}
                  <div className="flex items-center justify-between p-3.5">
                    <div>
                      <div className="font-medium text-foreground">Assigned Vehicle</div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {vehicle?.make ? `${vehicle.make} ${vehicle.model}` : "Bound Asset"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="rounded bg-muted/60 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        IND
                      </span>
                      <span className="font-bold text-base tracking-wider text-[#cc785c]">
                        {vehicle?.registrationNumber || "Unassigned"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2.5 pt-4 border-t border-border">
                <Link
                  href="/qr"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#cc785c] py-3 font-mono text-xs font-semibold text-white shadow-sm shadow-[#cc785c]/25 transition-all hover:bg-[#a9583e] active:scale-[0.99]"
                >
                  <span>Open Full QR Hub</span>
                  <VaahanIcon name="arrow-right" size={13} />
                </Link>

                {(qrSticker.status === "ACTIVE" || qrSticker.status === "ACTIVATED") && !qrSticker.replacementPending && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      onRequestReplacement();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted/20 py-2.5 font-mono text-xs font-semibold text-foreground transition-all hover:border-[#cc785c]/50 hover:text-[#cc785c] hover:bg-muted/40 active:scale-[0.99]"
                  >
                    <VaahanIcon name="refresh" size={13} />
                    <span>Request QR Sticker Replacement</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <VaahanIcon name="qr" size={24} />
              </div>
              <div>
                <h4 className="font-serif text-lg font-medium text-foreground">
                  No QR Sticker Bound
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  This vehicle does not have an active QR sticker. You can order a physical sticker or activate a retail kit.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href="/qr/buy"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl bg-[#cc785c] py-2.5 text-xs font-semibold text-white"
                >
                  Order Physical QR Sticker →
                </Link>
                <Link
                  href="/qr/activate"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl border border-border bg-muted/30 py-2.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Activate Retail Kit Code
                </Link>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
