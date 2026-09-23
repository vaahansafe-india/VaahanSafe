"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { VaahanSafeMark } from "@vaahansafe/ui/brand";
import { QrFrame } from "./QrFrame";
import { cn } from "@vaahansafe/ui/lib/utils";

interface PhysicalQrObjectProps {
  publicId?: string;
  visibleCode?: string;
  vehiclePlate?: string;
  status?: string;
  className?: string;
  interactive?: boolean;
}

export function PhysicalQrObject({
  publicId = "7F3K9021",
  visibleCode,
  vehiclePlate,
  status = "ACTIVATED",
  className,
}: PhysicalQrObjectProps) {
  const displayCode = visibleCode || `VS-${publicId}`;

  return (
    <div
      className={cn(
        "relative mx-auto flex w-full max-w-sm sm:max-w-md flex-col items-center rounded-2xl border border-border/90 bg-card p-4 sm:p-5 text-card-foreground shadow-xl dark:border-border/80 dark:bg-[#121417] dark:text-white dark:shadow-2xl overflow-hidden transition-colors",
        className
      )}
    >
      {/* Specular UV Lamination Effect */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 h-56 w-56 rounded-full bg-radial from-[#cc785c]/10 dark:from-[#cc785c]/15 via-transparent to-transparent blur-xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-radial from-teal-500/8 dark:from-teal-500/10 via-transparent to-transparent blur-xl"
        aria-hidden="true"
      />

      {/* Header: VaahanSafe Safety Mark */}
      <div className="flex w-full items-center justify-between border-b border-border/80 dark:border-white/10 pb-3.5">
        <div className="flex items-center gap-2">
          <VaahanSafeMark className="h-5 w-5 text-[#cc785c]" />
          <div>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-foreground dark:text-zinc-100">
              VAAHANSAFE
            </span>
            <span className="ml-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground dark:text-zinc-400">
              SAFETY IDENTITY
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          <span>VERIFIED</span>
        </div>
      </div>

      {/* Centerpiece: Physical QR Frame */}
      <div className="my-5 flex flex-col items-center">
        <div className="relative rounded-2xl bg-gradient-to-b from-neutral-100 to-neutral-200/90 dark:from-neutral-800/80 dark:to-neutral-900 border border-neutral-200/80 dark:border-border/60 p-1.5 shadow-xs dark:shadow-md">
          <QrFrame
            publicId={publicId}
            visibleCode={displayCode}
            status={status}
            size={160}
            className="border-0 shadow-inner"
          />
        </div>

        {/* Scan instruction */}
        <div className="mt-3 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground dark:text-zinc-300 font-medium">
          <VaahanIcon name="qr-scan" size={13} className="text-[#cc785c]" />
          <span>Scan with camera to connect</span>
        </div>
      </div>

      {/* Physical Sticker Anatomy Footer */}
      <div className="w-full rounded-xl border border-border/80 bg-muted/40 dark:border-white/10 dark:bg-white/[0.04] p-3">
        <div className="flex items-center justify-between text-xs">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground dark:text-zinc-400">
              Permanent Identity
            </div>
            <div className="font-mono font-bold tracking-wider text-foreground dark:text-zinc-100">
              {displayCode}
            </div>
          </div>
          {vehiclePlate && (
            <div className="text-right">
              <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground dark:text-zinc-400">
                Connected Vehicle
              </div>
              <div className="font-mono font-semibold text-foreground dark:text-zinc-100">
                {vehiclePlate}
              </div>
            </div>
          )}
        </div>

        {/* Conceptual Scan Progression */}
        <div className="mt-2.5 flex items-center justify-between border-t border-border/70 dark:border-white/10 pt-2 font-mono text-[8.5px] uppercase tracking-wider text-muted-foreground dark:text-zinc-400">
          <span className="text-foreground/90 dark:text-zinc-200 font-medium">1. Scan QR</span>
          <span className="text-muted-foreground/60 dark:text-zinc-500">&rarr;</span>
          <span className="text-foreground/90 dark:text-zinc-200 font-medium">2. Owner Shield</span>
          <span className="text-muted-foreground/60 dark:text-zinc-500">&rarr;</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">3. Safety View</span>
        </div>
      </div>
    </div>
  );
}
