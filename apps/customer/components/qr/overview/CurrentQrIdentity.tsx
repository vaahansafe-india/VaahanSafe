"use client";

import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { RotateCcw } from "lucide-react";
import { QrFrame } from "../primitives/QrFrame";
import type { QrStickerDetail } from "@/lib/qr-types";
import { cn } from "@vaahansafe/ui/lib/utils";

interface CurrentQrIdentityProps {
  sticker?: QrStickerDetail;
  onInspectQr?: () => void;
}

export function CurrentQrIdentity({
  sticker,
  onInspectQr,
}: CurrentQrIdentityProps) {
  if (!sticker) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-6 sm:p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <VaahanIcon name="qr" size={24} aria-hidden="true" />
        </div>
        <h3 className="mt-3 font-serif text-lg font-medium text-foreground">
          No QR Sticker Linked Yet
        </h3>
        <p className="mt-1 max-w-md mx-auto text-xs text-muted-foreground">
          Link a physical VaahanSafe safety sticker or activate a retail pack to anchor your vehicle's identity.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Link
            href="/qr/activate"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#cc785c] px-3.5 font-mono text-xs font-semibold uppercase text-white hover:bg-[#b5654b] transition-colors"
          >
            <span>Activate Retail QR</span>
          </Link>
          <Link
            href="/qr/buy"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3.5 font-mono text-xs font-semibold uppercase text-foreground hover:bg-muted transition-colors"
          >
            <span>Buy Sticker</span>
          </Link>
        </div>
      </div>
    );
  }

  const isActivated = sticker.status === "ACTIVATED";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <div className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-[#cc785c]">
            CURRENT HARDWARE ANCHOR
          </div>
          <h2 className="mt-0.5 font-serif text-xl font-medium text-foreground">
            Authoritative QR Identity
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
              isActivated
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                isActivated ? "bg-emerald-500" : "bg-amber-500"
              )}
            />
            <span>{isActivated ? "Active & Linked" : sticker.status}</span>
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-12 sm:items-center">
        {/* Left Info Column */}
        <div className="sm:col-span-7 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
              <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                Public Identity
              </div>
              <div className="mt-1 font-mono text-sm font-bold text-foreground">
                {sticker.visibleCode}
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
              <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                Linked Vehicle
              </div>
              <div className="mt-1 font-mono text-sm font-bold text-foreground truncate">
                {sticker.linkedVehicle?.maskedPlate || "Unassigned"}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Permanent Resolver URL</span>
              <span className="font-mono text-[10.5px] text-foreground select-all">
                {sticker.resolverUrl}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-2 text-[11px]">
              <span>Emergency Contacts Relay</span>
              <span className="font-semibold text-foreground">
                {sticker.emergencyContactsCount} Priority Contact{sticker.emergencyContactsCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onInspectQr}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground text-background px-3 font-mono text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              <VaahanIcon name="qr" size={13} aria-hidden="true" />
              <span>Inspect QR</span>
            </button>
            <Link
              href="/qr/digital"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 font-mono text-xs font-semibold uppercase tracking-wider text-foreground hover:bg-muted transition-colors"
            >
              <VaahanIcon name="phone" size={13} aria-hidden="true" />
              <span>Digital Pass</span>
            </Link>
            <Link
              href="/qr/replace"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              <span>Replace</span>
            </Link>
          </div>
        </div>

        {/* Right QR Matrix Column */}
        <div className="sm:col-span-5 flex justify-center">
          <QrFrame
            publicId={sticker.publicId}
            visibleCode={sticker.visibleCode}
            status={sticker.status}
            size={140}
          />
        </div>
      </div>
    </div>
  );
}
