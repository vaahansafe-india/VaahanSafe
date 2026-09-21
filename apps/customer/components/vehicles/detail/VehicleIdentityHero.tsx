"use client";

import * as React from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Button,
} from "@vaahansafe/ui";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import { VehicleIdentityRail } from "../VehicleIdentityRail";
import type { VehicleDossierData } from "@/lib/vehicle-types";

interface VehicleIdentityHeroProps {
  vehicle: VehicleDossierData;
  onOpenDetails: () => void;
  onOpenQr: () => void;
  onOpenSafety: () => void;
  onOpenContacts: () => void;
  onOpenRemove: () => void;
}

function getCategoryIcon(type: string): VaahanIconName {
  switch (type) {
    case "MOTORCYCLE":
    case "SCOOTER":
      return "bike";
    case "COMMERCIAL":
      return "truck";
    case "CAR":
    default:
      return "car";
  }
}

export function VehicleIdentityHero({
  vehicle,
  onOpenDetails,
  onOpenQr,
  onOpenSafety,
  onOpenContacts,
  onOpenRemove,
}: VehicleIdentityHeroProps) {
  const [isUnmasked, setIsUnmasked] = React.useState(false);

  const iconName = getCategoryIcon(vehicle.type);
  const isQrActive = vehicle.qr.status === "ACTIVE" || vehicle.qr.status === "ACTIVATED";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card text-card-foreground p-5 sm:p-7 md:p-8 shadow-xs transition-colors">
      {/* Subtle Background Accent Gradient */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#cc785c]/5 blur-3xl" />

      {/* Decorative Brand Identity Watermark */}
      <div className="pointer-events-none absolute right-4 top-4 hidden sm:block font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground/30 select-none">
        VAAHANSAFE IDENTITY DOSSIER
      </div>

      {/* 01. Eyebrow & Status Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
          <span>VEHICLE / IDENTITY RECORD</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
          <span className="rounded-md bg-muted px-2.5 py-0.5 font-medium text-foreground/70 border border-border/50">
            {vehicle.type}
          </span>
          <span
            className={`rounded-md px-2.5 py-0.5 font-bold uppercase border ${
              vehicle.qr.replacementPending
                ? "bg-[#cc785c]/15 text-[#cc785c] border-[#cc785c]/30"
                : isQrActive
                ? "bg-[#5db8a6]/15 text-[#5db8a6] border-[#5db8a6]/30"
                : "bg-[#e8a55a]/15 text-[#e8a55a] border-[#e8a55a]/30"
            }`}
          >
            {vehicle.qr.replacementPending
              ? `REPLACING (${vehicle.qr.replacementStatus || "PENDING"})`
              : vehicle.qr.status}
          </span>
        </div>
      </div>

      {/* 02. Core Identity Surface */}
      <div className="mt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Silhouette + Title + Plate + Metadata */}
        <div className="flex items-start gap-4 sm:gap-5 min-w-0">
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-[#cc785c]/10 text-[#cc785c] border border-[#cc785c]/25 shadow-xs">
            <VaahanIcon name={iconName} size={30} />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
              {vehicle.make} {vehicle.model}
            </h1>

            {/* Registration Plate & Masking Toggle */}
            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-sm sm:text-base font-bold uppercase tracking-wider text-foreground bg-muted/70 px-3 py-0.5 rounded-lg border border-border shadow-2xs">
                {isUnmasked ? vehicle.registrationNumber : vehicle.registrationNumberMasked}
              </span>

              <button
                type="button"
                onClick={() => setIsUnmasked(!isUnmasked)}
                className="text-muted-foreground hover:text-foreground text-xs font-mono transition-colors underline-offset-4 hover:underline"
                title={isUnmasked ? "Hide registration plate" : "Reveal full registration plate"}
              >
                {isUnmasked ? "Hide" : "Show Full Plate"}
              </button>
            </div>

            {/* Metadata Tags */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2.5 text-xs font-mono text-muted-foreground">
              <span>ID: <strong className="text-foreground font-semibold">{vehicle.identityId}</strong></span>
              {vehicle.year && (
                <>
                  <span>&bull;</span>
                  <span>Year: <strong className="text-foreground font-semibold">{vehicle.year}</strong></span>
                </>
              )}
              {vehicle.color && (
                <>
                  <span>&bull;</span>
                  <span>Color: <strong className="text-foreground font-semibold">{vehicle.color}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
          <Button
            type="button"
            onClick={onOpenDetails}
            className="bg-[#cc785c] hover:bg-[#a9583e] text-white font-mono text-xs uppercase tracking-wider h-10 px-4 shadow-xs"
          >
            <VaahanIcon name="vehicle" size={14} className="mr-1.5" />
            <span>Manage Vehicle</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-border bg-background hover:bg-muted text-foreground font-mono text-xs h-10 px-3"
              >
                <span>Actions</span>
                <VaahanIcon name="chevron-down" size={12} className="ml-1 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={onOpenDetails}>
                <VaahanIcon name="vehicle" size={14} className="mr-2" />
                <span>Edit Vehicle Specs</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenQr}>
                <VaahanIcon name="qr" size={14} className="mr-2" />
                <span>QR Lifeline Status</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenSafety}>
                <VaahanIcon name="phone" size={14} className="mr-2" />
                <span>Public Safety View</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenContacts}>
                <VaahanIcon name="phone" size={14} className="mr-2" />
                <span>Emergency Contacts</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onOpenRemove}
                className="text-destructive focus:text-destructive"
              >
                <VaahanIcon name="close" size={14} className="mr-2" />
                <span>Remove Vehicle</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 03. Relationship Rail Strip */}
      <div className="mt-8 border-t border-border/60 pt-5">
        <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
          IDENTITY LIFELINE RELATIONSHIP
        </div>
        <VehicleIdentityRail
          vehicleState={vehicle.readiness.vehicleNode}
          identityState={vehicle.readiness.identityNode}
          qrState={vehicle.readiness.qrNode}
          safetyState={vehicle.readiness.safetyNode}
          identityLabel={vehicle.identityId}
          qrStatus={vehicle.qr.status}
          replacementPending={vehicle.qr.replacementPending}
          replacementStatus={vehicle.qr.replacementStatus}
          safetyStatus={vehicle.safety.status}
          onOpenVehicleSheet={onOpenDetails}
          onOpenQrSheet={onOpenQr}
          onOpenSafetySheet={onOpenSafety}
        />
      </div>
    </div>
  );
}
