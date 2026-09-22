"use client";

import React, { useState } from "react";
import {
  Button,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";
import type { EligibleVehicleDto, ActivationCommitResultDto } from "@/lib/types";

interface ActivationReviewProps {
  publicId: string;
  visibleCode?: string;
  vehicle: EligibleVehicleDto;
  onActivated: (result: ActivationCommitResultDto) => void;
  onChangeVehicle: () => void;
}

export function ActivationReview({
  publicId,
  visibleCode,
  vehicle,
  onActivated,
  onChangeVehicle,
}: ActivationReviewProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayCode = visibleCode || publicId;

  const handleCommitActivation = async () => {
    setIsConfirmOpen(false);
    setIsCommitting(true);
    setError(null);

    try {
      const res = await fetch("/api/activate/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicId,
          vehicleId: vehicle.id,
        }),
      });

      const data = await res.json();

      if (data.success && data.publicId && data.visibleCode && data.vehicleReference && data.activatedAt) {
        onActivated(data as ActivationCommitResultDto);
      } else {
        setError(data.error || "We couldn't commit activation right now. Please try again.");
      }
    } catch {
      setError("Network error while connecting to activation service. Please check your connection.");
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl text-foreground font-normal tracking-tight">
          Review & Activate QR
        </h1>

        <p className="text-xs sm:text-sm text-muted-foreground max-w-lg leading-relaxed">
          Please confirm your vehicle and QR details below. Once confirmed, your safety identity will be active immediately.
        </p>
      </div>

      {/* Signature Central Binding Diagram */}
      <div className="border-y border-border py-6 space-y-6">
        {/* Opposing Identities Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Identity A: Physical QR */}
          <div className="space-y-1">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Physical QR
            </div>
            <div className="font-mono text-sm sm:text-base font-bold text-foreground truncate">
              {displayCode}
            </div>
            <div className="text-[11px] text-muted-foreground">
              Possession verified
            </div>
          </div>

          {/* Identity B: Vehicle Target */}
          <div className="space-y-1 text-right">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Target Vehicle
            </div>
            <div className="font-bold text-sm sm:text-base text-foreground truncate">
              {vehicle.make} {vehicle.model}
            </div>
            <div className="font-mono text-[11px] text-muted-foreground">
              {vehicle.maskedRegistration} •{" "}
              <button
                type="button"
                onClick={onChangeVehicle}
                className="text-primary underline hover:no-underline"
              >
                Change
              </button>
            </div>
          </div>
        </div>

        {/* Structural Convergence Geometry */}
        <div className="relative py-2 select-none" aria-hidden="true">
          <div className="flex items-center justify-between">
            <span className="h-3 w-3 rounded-full bg-primary ring-2 ring-primary/30" />
            <div className="flex-1 mx-2 h-px bg-border flex items-center justify-center">
              <span className="h-2 w-2 rounded-full border border-primary bg-background" />
            </div>
            <span className="h-3 w-3 rounded-full bg-primary ring-2 ring-primary/30" />
          </div>

          {/* Central Vertical Stem to Target Identity */}
          <div className="flex flex-col items-center pt-2 space-y-1">
            <div className="h-4 w-px bg-border" />
            <span className="h-2.5 w-2.5 rounded-full border border-dashed border-primary" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              VaahanSafe Identity (Ready to Bind)
            </span>
          </div>
        </div>

        {/* Security Checklist */}
        <div className="border-t border-border pt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <VaahanIcon name="check" size={13} className="text-emerald-500 shrink-0" />
            <span className="text-foreground text-[11px]">QR recognized</span>
          </div>
          <div className="flex items-center gap-2">
            <VaahanIcon name="check" size={13} className="text-emerald-500 shrink-0" />
            <span className="text-foreground text-[11px]">Scratch Proof Verified</span>
          </div>
          <div className="flex items-center gap-2">
            <VaahanIcon name="check" size={13} className="text-emerald-500 shrink-0" />
            <span className="text-foreground text-[11px]">Mandatory Mobile Verified</span>
          </div>
          <div className="flex items-center gap-2">
            <VaahanIcon name="check" size={13} className="text-emerald-500 shrink-0" />
            <span className="text-foreground text-[11px]">Vehicle selected</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive space-y-1">
          <div className="font-semibold flex items-center gap-2">
            <VaahanIcon name="alert" size={14} />
            <span>Activation Notice</span>
          </div>
          <p className="leading-relaxed pl-5 text-[11px]">{error}</p>
        </div>
      )}

      {/* Action Commitment Button */}
      <div className="space-y-3 pt-1">
        <Button
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          disabled={isCommitting}
          className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
        >
          {isCommitting ? (
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span>Activating identity...</span>
            </div>
          ) : (
            <span>Activate QR</span>
          )}
        </Button>

        <p className="text-[11px] font-mono text-center text-muted-foreground">
          Activation securely binds this QR to the selected vehicle.
        </p>
      </div>

      {/* Sensitive Confirmation Dialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] sm:max-w-md rounded-2xl p-5 sm:p-6 border border-border bg-background shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold tracking-tight">
              Activate this QR?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              This will connect the verified physical QR to the selected vehicle.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">QR</span>
              <span className="font-bold text-foreground">{displayCode}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">VEHICLE</span>
              <span className="font-bold text-foreground">
                {vehicle.make} {vehicle.model} ({vehicle.maskedRegistration})
              </span>
            </div>
          </div>

          <AlertDialogFooter className="flex-row gap-2 justify-end pt-2">
            <AlertDialogCancel className="h-9 px-4 rounded-lg text-xs font-mono">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCommitActivation}
              className="h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-mono font-semibold"
            >
              Activate QR
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
