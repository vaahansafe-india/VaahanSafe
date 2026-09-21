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
import { VehicleIdentityRail } from "./VehicleIdentityRail";
import type { VehicleRegistryItem as VehicleItemType } from "@/lib/vehicle-types";

interface VehicleRegistryItemProps {
  item: VehicleItemType;
  index: number;
  viewMode?: "REGISTRY" | "COMPACT";
  onOpenDetails: (item: VehicleItemType) => void;
  onOpenQr: (item: VehicleItemType) => void;
  onOpenSafety: (item: VehicleItemType) => void;
  onOpenRemove: (item: VehicleItemType) => void;
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

export function VehicleRegistryItem({
  item,
  index,
  viewMode = "REGISTRY",
  onOpenDetails,
  onOpenQr,
  onOpenSafety,
  onOpenRemove,
}: VehicleRegistryItemProps) {
  const [isUnmasked, setIsUnmasked] = React.useState(false);

  const formattedIndex = String(index + 1).padStart(2, "0");
  const iconName = getCategoryIcon(item.type);

  // 01. High-Density Compact View
  if (viewMode === "COMPACT") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 text-xs transition-colors hover:bg-muted/30">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-muted-foreground">{formattedIndex}</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#cc785c]/10 text-[#cc785c]">
            <VaahanIcon name={iconName} size={15} />
          </div>
          <div>
            <div className="font-semibold text-foreground">
              {item.make} {item.model}
            </div>
            <div className="font-mono text-[11px] text-muted-foreground">
              {isUnmasked ? item.registrationNumber : item.registrationNumberMasked}
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-6 font-mono text-[11px]">
          <div>
            <span className="text-muted-foreground mr-1.5">ID:</span>
            <span className="font-medium text-foreground">{item.identityId}</span>
          </div>
          <div>
            <span className="text-muted-foreground mr-1.5">QR:</span>
            <span
              className={
                item.qr.replacementPending
                  ? "text-[#cc785c] font-semibold"
                  : item.qr.status === "ACTIVE" || item.qr.status === "ACTIVATED"
                  ? "text-[#5db8a6]"
                  : "text-[#e8a55a]"
              }
            >
              {item.qr.replacementPending
                ? "Replacing"
                : item.qr.status === "ACTIVATED" || item.qr.status === "ACTIVE"
                ? "Active"
                : item.qr.status}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground mr-1.5">Safety:</span>
            <span className={item.safety.status === "CONFIGURED" ? "text-[#5db8a6]" : "text-[#e8a55a]"}>
              {item.safety.status === "CONFIGURED" ? "Configured" : "Setup"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/vehicles/${item.id}`}
            className="inline-flex h-7 items-center gap-1 rounded-md bg-muted px-2.5 font-mono text-[11px] font-semibold text-foreground hover:bg-[#cc785c] hover:text-white transition-colors"
          >
            <span>Dossier</span>
            <VaahanIcon name="arrow-right" size={11} />
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="More actions"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
              >
                &bull;&bull;&bull;
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onOpenDetails(item)}>
                Manage Vehicle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenQr(item)}>
                View QR Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenSafety(item)}>
                Safety View
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onOpenRemove(item)}
                className="text-destructive focus:text-destructive"
              >
                Remove Vehicle
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  // 02. Rich Asymmetric Identity Ledger View
  return (
    <div className="group/item relative rounded-2xl border border-border bg-card p-5 sm:p-6 transition-all hover:border-[#cc785c]/40 hover:shadow-xs">
      {/* 02.1 Top Metadata Row */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="font-bold text-[#cc785c]">{formattedIndex}</span>
          <span>/</span>
          <span>VEHICLE ASSET</span>
          <span className="hidden sm:inline">&bull;</span>
          <span className="hidden sm:inline font-semibold text-foreground/70">
            {item.type}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px]">
          {item.readiness.isReady ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#5db8a6]/15 px-2 py-0.5 font-semibold text-[#5db8a6]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5db8a6]" />
              <span>IDENTITY READY</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8a55a]/15 px-2 py-0.5 font-semibold text-[#e8a55a]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e8a55a]" />
              <span>NEEDS ATTENTION ({item.attention.length})</span>
            </span>
          )}
        </div>
      </div>

      {/* 02.2 Core Asymmetric Identity Ledger Body: Top Specs & Actions Row */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Column: Physical Asset Spec */}
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#cc785c]/10 text-[#cc785c] border border-[#cc785c]/20 shadow-xs">
            <VaahanIcon name={iconName} size={24} />
          </div>

          <div className="min-w-0 flex-1">
            <Link
              href={`/vehicles/${item.id}`}
              className="block font-medium text-base sm:text-lg text-foreground hover:text-[#cc785c] transition-colors truncate"
            >
              {item.make} {item.model}
            </Link>

            {/* Masked Registration Plate with Unmask Toggle */}
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground bg-muted/60 px-2.5 py-0.5 rounded border border-border">
                {isUnmasked ? item.registrationNumber : item.registrationNumberMasked}
              </span>

              <button
                type="button"
                onClick={() => setIsUnmasked(!isUnmasked)}
                className="text-muted-foreground hover:text-foreground text-[10px] font-mono transition-colors"
                title={isUnmasked ? "Mask registration number" : "Reveal full registration number"}
              >
                {isUnmasked ? "Hide" : "Show"}
              </button>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground font-mono">
              {item.year && <span>{item.year}</span>}
              {item.year && item.color && <span>&bull;</span>}
              {item.color && <span>{item.color}</span>}
            </div>
          </div>
        </div>

        {/* Right Column: State & Actions */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          <Link
            href={`/vehicles/${item.id}`}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-foreground text-background px-3.5 font-mono text-xs font-semibold uppercase tracking-wider transition-all hover:bg-[#cc785c] hover:text-white shadow-xs"
          >
            <span>Open Identity</span>
            <VaahanIcon name="arrow-right" size={12} />
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 font-mono text-xs text-muted-foreground hover:text-foreground border-border"
              >
                <span>More</span>
                <VaahanIcon name="chevron-down" size={12} className="ml-1 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onOpenDetails(item)}>
                <VaahanIcon name="vehicle" size={14} className="mr-2" />
                <span>Manage Vehicle</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenQr(item)}>
                <VaahanIcon name="qr" size={14} className="mr-2" />
                <span>View QR Details</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenSafety(item)}>
                <VaahanIcon name="phone" size={14} className="mr-2" />
                <span>Public Safety View</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onOpenRemove(item)}
                className="text-destructive focus:text-destructive"
              >
                <VaahanIcon name="close" size={14} className="mr-2" />
                <span>Remove Vehicle</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 02.3 Dedicated Full-Width Relationship Rail Strip */}
      <div className="mt-5 border-t border-border/60 pt-4">
        <VehicleIdentityRail
          vehicleState={item.readiness.vehicleNode}
          identityState={item.readiness.identityNode}
          qrState={item.readiness.qrNode}
          safetyState={item.readiness.safetyNode}
          identityLabel={item.identityId}
          qrStatus={item.qr.status}
          replacementPending={item.qr.replacementPending}
          replacementStatus={item.qr.replacementStatus}
          safetyStatus={item.safety.status}
          onOpenVehicleSheet={() => onOpenDetails(item)}
          onOpenQrSheet={() => onOpenQr(item)}
          onOpenSafetySheet={() => onOpenSafety(item)}
        />
      </div>
    </div>
  );
}
