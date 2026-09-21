"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VaahanIcon } from "@vaahansafe/icons";
import { VehicleIdentityHero } from "./VehicleIdentityHero";
import { VehicleFactStrip } from "./VehicleFactStrip";
import { VehicleReadinessCompass } from "./VehicleReadinessCompass";
import { VehicleAttention } from "./VehicleAttention";
import { VehicleScanPreview } from "./VehicleScanPreview";
import { VehicleHistory } from "./VehicleHistory";
import { VehicleDetailsSheet } from "../sheets/VehicleDetailsSheet";
import { QrIdentitySheet } from "../sheets/QrIdentitySheet";
import { SafetyViewSheet } from "../sheets/SafetyViewSheet";
import { EmergencyContactSheet } from "../sheets/EmergencyContactSheet";
import { RemoveVehicleAlert } from "../alerts/RemoveVehicleAlert";
import type { VehicleDossierData } from "@/lib/vehicle-types";

interface VehicleDossierProps {
  vehicle: VehicleDossierData;
}

export function VehicleDossier({ vehicle }: VehicleDossierProps) {
  const router = useRouter();

  // Active sheets & alerts state
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [isQrOpen, setIsQrOpen] = React.useState(false);
  const [isSafetyOpen, setIsSafetyOpen] = React.useState(false);
  const [isContactsOpen, setIsContactsOpen] = React.useState(false);
  const [isRemoveOpen, setIsRemoveOpen] = React.useState(false);

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* 01. Back Link */}
      <div>
        <Link
          href="/vehicles"
          className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-[#cc785c]"
        >
          <VaahanIcon name="arrow-left" size={13} />
          <span>Back to Vehicle Registry</span>
        </Link>
      </div>

      {/* 02. Dark Identity Dossier Hero */}
      <VehicleIdentityHero
        vehicle={vehicle}
        onOpenDetails={() => setIsDetailsOpen(true)}
        onOpenQr={() => setIsQrOpen(true)}
        onOpenSafety={() => setIsSafetyOpen(true)}
        onOpenContacts={() => setIsContactsOpen(true)}
        onOpenRemove={() => setIsRemoveOpen(true)}
      />

      {/* 03. Structured Fact Strip */}
      <VehicleFactStrip vehicle={vehicle} />

      {/* 04. Split: Attention Surface & Readiness Compass */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-6">
          <VehicleAttention
            attentionItems={vehicle.attention}
            onOpenQr={() => setIsQrOpen(true)}
            onOpenSafety={() => setIsSafetyOpen(true)}
            onOpenContacts={() => setIsContactsOpen(true)}
            onOpenDetails={() => setIsDetailsOpen(true)}
          />

          {/* Quick Contact Overview Card */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#cc785c]/10 text-[#cc785c]">
                  <VaahanIcon name="phone" size={13} />
                </div>
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                  Emergency Relay
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsContactsOpen(true)}
                className="inline-flex items-center gap-1 font-mono text-xs text-[#cc785c] hover:underline"
              >
                <span>Manage Contacts</span>
                <VaahanIcon name="arrow-right" size={11} />
              </button>
            </div>
            <div className="text-xs leading-relaxed">
              {vehicle.contacts.count > 0 ? (
                <p className="text-muted-foreground">
                  {vehicle.contacts.count} priority contact{vehicle.contacts.count > 1 ? "s" : ""} configured. Primary relay will alert <strong className="text-foreground font-semibold">{vehicle.contacts.primaryName}</strong> instantly via SMS when scanned.
                </p>
              ) : (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-destructive space-y-1">
                  <div className="font-semibold text-xs flex items-center gap-1.5">
                    <VaahanIcon name="warning" size={13} />
                    <span>No Emergency Contacts Configured</span>
                  </div>
                  <p className="text-[11px] text-destructive/90 leading-normal">
                    First responders will have no direct relay phone numbers during an emergency scan.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <VehicleReadinessCompass
            vehicle={vehicle}
            onOpenDetails={() => setIsDetailsOpen(true)}
            onOpenQr={() => setIsQrOpen(true)}
            onOpenSafety={() => setIsSafetyOpen(true)}
            onOpenContacts={() => setIsContactsOpen(true)}
          />
        </div>
      </div>

      {/* 05. Telemetry & History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VehicleScanPreview
          scans={vehicle.recentScans}
          qrPublicId={vehicle.qr.publicId}
        />
        <VehicleHistory history={vehicle.lifecycleHistory} />
      </div>

      {/* 06. Interactive Sheets & Alert Dialogs */}
      <VehicleDetailsSheet
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        vehicle={vehicle}
        onSuccess={handleRefresh}
      />

      <QrIdentitySheet
        open={isQrOpen}
        onOpenChange={setIsQrOpen}
        vehicle={vehicle}
      />

      <SafetyViewSheet
        open={isSafetyOpen}
        onOpenChange={setIsSafetyOpen}
        vehicle={vehicle}
        onSuccess={handleRefresh}
      />

      <EmergencyContactSheet
        open={isContactsOpen}
        onOpenChange={setIsContactsOpen}
        vehicle={vehicle}
        onSuccess={handleRefresh}
      />

      <RemoveVehicleAlert
        open={isRemoveOpen}
        onOpenChange={setIsRemoveOpen}
        vehicle={vehicle}
        onSuccess={() => {
          router.push("/vehicles");
          router.refresh();
        }}
      />
    </div>
  );
}
