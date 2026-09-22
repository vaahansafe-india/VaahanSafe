"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";
import { getQrUrl, getCustomerUrl } from "@vaahansafe/config";

interface ActivationSuccessProps {
  publicId: string;
  visibleCode?: string;
  vehicleReference?: string;
  activatedAt?: string;
}

export function ActivationSuccess({
  publicId,
  visibleCode,
  vehicleReference,
}: ActivationSuccessProps) {
  const publicQrUrl = getQrUrl(publicId);
  const customerVehiclesUrl = getCustomerUrl("/vehicles");
  const displayCode = visibleCode || publicId;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="font-mono text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
            Activation Complete
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl text-foreground font-normal tracking-tight">
          Your QR is now connected.
        </h1>

        <p className="text-xs sm:text-sm text-muted-foreground max-w-lg leading-relaxed">
          Your physical QR is connected to this vehicle. You can now preview the public safety view and manage the vehicle in your account.
        </p>
      </div>

      {/* Signature One Continuous Connection Geometry (Visual Payoff) */}
      <div className="border-y border-border py-6 space-y-6">
        <div className="grid grid-cols-2 gap-4 font-mono text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Physical QR
            </span>
            <div className="font-bold text-foreground truncate">{displayCode}</div>
          </div>
          <div className="space-y-0.5 text-right">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Connected Vehicle
            </span>
            <div className="font-bold text-foreground truncate">
              {vehicleReference || "Verified Vehicle"}
            </div>
          </div>
        </div>

        {/* Unified Continuous Bridge */}
        <div className="relative py-2 select-none" aria-hidden="true">
          <div className="flex items-center justify-between">
            <span className="h-3.5 w-3.5 rounded-full bg-primary ring-4 ring-primary/20" />
            <div className="flex-1 mx-2 h-0.5 bg-primary" />
            <span className="h-3.5 w-3.5 rounded-full bg-primary ring-4 ring-primary/20" />
          </div>

          <div className="flex flex-col items-center pt-2 space-y-1.5">
            <div className="h-5 w-0.5 bg-primary" />
            <span className="h-3 w-3 rounded-full bg-primary ring-4 ring-primary/20" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
              VaahanSafe Identity Active
            </span>
            <div className="h-4 w-0.5 bg-emerald-500" />
            <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-semibold">
              Live Emergency Routing
            </span>
          </div>
        </div>

        {/* Verification Metadata Status */}
        <div className="border-t border-border pt-3.5 flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span>Physical QR connected to vehicle</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            STATUS: ACTIVE
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="space-y-3 pt-1">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <a
            href={publicQrUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center h-12 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
          >
            <span>Preview Public Safety View</span>
            <VaahanIcon name="external-link" size={14} className="ml-2" />
          </a>

          <a
            href={customerVehiclesUrl}
            className="flex-1 inline-flex items-center justify-center h-12 px-5 rounded-lg border border-border bg-background hover:bg-muted/40 text-foreground text-xs font-mono font-medium transition-colors"
          >
            <span>Manage Vehicle →</span>
          </a>
        </div>

        <div className="text-center pt-1">
          <Link
            href="/"
            className="font-mono text-xs text-muted-foreground hover:text-foreground underline transition-colors"
          >
            Done
          </Link>
        </div>
      </div>
    </div>
  );
}
