"use client";

import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { PhysicalQrObject } from "../primitives/PhysicalQrObject";
import { QrSignalRail } from "../primitives/QrSignalRail";
import type { QrOverviewData } from "@/lib/qr-types";

interface QrIdentityHeroProps {
  overview: QrOverviewData;
  onOpenSignalNode?: (nodeKey: string) => void;
}

export function QrIdentityHero({
  overview,
  onOpenSignalNode,
}: QrIdentityHeroProps) {
  const primaryVehicle = overview.primaryVehicle;
  const primarySticker = overview.primarySticker;
  const hasActiveQr = primarySticker?.status === "ACTIVATED";

  return (
    <div className="relative w-full max-w-full">
      {/* Background Ambience Gradient */}
      <div
        className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-radial from-[#cc785c]/8 via-transparent to-transparent blur-3xl"
        aria-hidden="true"
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
        {/* Left Column: Asymmetric Editorial Pitch */}
        <div className="lg:col-span-7">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
            <span>VAAHANSAFE</span>
            <span className="text-muted-foreground/60">/</span>
            <span>QR IDENTITY</span>
          </div>

          <h1 className="mt-2.5 font-serif text-2xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-foreground leading-[1.18] lg:leading-[1.12]">
            One QR. A useful vehicle identity.
          </h1>

          <p className="mt-3.5 max-w-xl text-xs sm:text-sm lg:text-base text-muted-foreground leading-relaxed">
            Your VaahanSafe QR connects your vehicle to its verified identity and the critical emergency contacts you choose to make available.
          </p>

          {/* Primary Action Buttons — Aligned in One Single Row */}
          <div className="mt-6 flex flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {hasActiveQr ? (
              <>
                <Link
                  href="/qr/digital"
                  className="flex-1 sm:flex-initial inline-flex h-10 sm:h-11 items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-[#cc785c] px-3 sm:px-5 font-mono text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-[#b5654b] shadow-xs hover:shadow-sm text-center"
                >
                  <VaahanIcon name="qr" size={14} className="shrink-0" aria-hidden="true" />
                  <span className="truncate">View Digital Pass</span>
                </Link>
                <Link
                  href="/qr/codes"
                  className="flex-1 sm:flex-initial inline-flex h-10 sm:h-11 items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-border bg-card px-3 sm:px-5 font-mono text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-muted text-center"
                >
                  <VaahanIcon name="activity" size={13} className="shrink-0" aria-hidden="true" />
                  <span className="truncate">Manage QR Codes</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/qr/activate"
                  className="flex-1 sm:flex-initial inline-flex h-10 sm:h-11 items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-[#cc785c] px-2.5 sm:px-5 font-mono text-[10.5px] sm:text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-[#b5654b] shadow-xs hover:shadow-sm text-center"
                >
                  <VaahanIcon name="qr-scan" size={14} className="shrink-0" aria-hidden="true" />
                  <span className="truncate">Activate Retail QR</span>
                </Link>
                <Link
                  href="/qr/buy"
                  className="flex-1 sm:flex-initial inline-flex h-10 sm:h-11 items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-border bg-card px-2.5 sm:px-5 font-mono text-[10.5px] sm:text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-muted text-center"
                >
                  <VaahanIcon name="cart" size={14} className="shrink-0" aria-hidden="true" />
                  <span className="truncate">Buy QR Safety Kit</span>
                </Link>
              </>
            )}
          </div>

          {/* Identity Snapshot Pill */}
          {primaryVehicle && (
            <div className="mt-6 flex flex-wrap items-center gap-2 sm:gap-3 border-t border-border/60 pt-4 sm:pt-5 font-mono text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-bold text-foreground">
                <VaahanIcon name="vehicle" size={14} className="text-[#cc785c]" />
                <span>{primaryVehicle.maskedPlate}</span>
              </span>
              <span>&bull;</span>
              <span>{primaryVehicle.make} {primaryVehicle.model}</span>
              <span>&bull;</span>
              <span className="text-[#cc785c] font-semibold">{primaryVehicle.identityId}</span>
            </div>
          )}
        </div>

        {/* Right Column: Tangible Physical QR Object */}
        <div className="lg:col-span-5 flex justify-center w-full">
          <PhysicalQrObject
            publicId={primarySticker?.publicId || "7F3K9021"}
            visibleCode={primarySticker?.visibleCode}
            vehiclePlate={primaryVehicle?.maskedPlate}
            status={primarySticker?.status || "ACTIVATED"}
            className="w-full max-w-sm sm:max-w-md mx-auto"
          />
        </div>
      </div>

      {/* Standalone Bottom Signal Rail */}
      <div className="mt-8 sm:mt-10">
        <QrSignalRail
          states={overview.railStates}
          onNodeClick={onOpenSignalNode}
        />
      </div>
    </div>
  );
}
