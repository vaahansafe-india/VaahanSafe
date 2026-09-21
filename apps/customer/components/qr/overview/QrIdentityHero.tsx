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
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card/80 dark:bg-card/40 text-card-foreground p-6 sm:p-8 lg:p-10 shadow-xs backdrop-blur-xs transition-colors">
      {/* Background Ambience Gradient */}
      <div
        className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-radial from-[#cc785c]/10 via-transparent to-transparent blur-3xl"
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

          <h1 className="mt-2.5 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl lg:text-5xl lg:leading-[1.12]">
            One QR. A useful vehicle identity.
          </h1>

          <p className="mt-3.5 max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            Your VaahanSafe QR connects your vehicle to its verified identity and the critical emergency contacts you choose to make available.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {hasActiveQr ? (
              <>
                <Link
                  href="/qr/digital"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#cc785c] px-5 font-mono text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-[#b5654b] shadow-xs hover:shadow-sm"
                >
                  <VaahanIcon name="qr" size={15} aria-hidden="true" />
                  <span>View Digital Pass</span>
                </Link>
                <Link
                  href="/qr/codes"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background/80 px-5 font-mono text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-muted"
                >
                  <VaahanIcon name="activity" size={14} aria-hidden="true" />
                  <span>Manage QR Codes</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/qr/activate"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#cc785c] px-5 font-mono text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-[#b5654b] shadow-xs hover:shadow-sm"
                >
                  <VaahanIcon name="qr-scan" size={15} aria-hidden="true" />
                  <span>Activate Retail QR</span>
                </Link>
                <Link
                  href="/qr/buy"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background/80 px-5 font-mono text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-muted"
                >
                  <VaahanIcon name="cart" size={15} aria-hidden="true" />
                  <span>Buy QR Safety Kit</span>
                </Link>
              </>
            )}
          </div>

          {/* Identity Snapshot Pill */}
          {primaryVehicle && (
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border/60 pt-5 font-mono text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-bold text-foreground">
                <VaahanIcon name="car" size={14} className="text-[#cc785c]" />
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
        <div className="lg:col-span-5 flex justify-center">
          <PhysicalQrObject
            publicId={primarySticker?.publicId || "7F3K9021"}
            visibleCode={primarySticker?.visibleCode}
            vehiclePlate={primaryVehicle?.maskedPlate}
            status={primarySticker?.status || "ACTIVATED"}
            className="w-full"
          />
        </div>
      </div>

      {/* Embedded Bottom Signal Rail */}
      <div className="mt-8">
        <QrSignalRail
          states={overview.railStates}
          onNodeClick={onOpenSignalNode}
        />
      </div>
    </div>
  );
}
