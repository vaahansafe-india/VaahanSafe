"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type {
  DashboardVehicle,
  DashboardQrSticker,
  DashboardEmergencyProfile,
} from "@/lib/dashboard-types";

interface IdentityReadinessRailProps {
  vehicle: DashboardVehicle | null;
  qrSticker: DashboardQrSticker | null;
  safetyProfile: DashboardEmergencyProfile;
  onOpenVehicleSheet: () => void;
  onOpenQrSheet: () => void;
  onOpenSafetySheet: () => void;
  onOpenContactsSheet: () => void;
}

export function IdentityReadinessRail({
  vehicle,
  qrSticker,
  safetyProfile,
  onOpenVehicleSheet,
  onOpenQrSheet,
  onOpenSafetySheet,
  onOpenContactsSheet,
}: IdentityReadinessRailProps) {
  const isQrActive = qrSticker?.status === "ACTIVE" || qrSticker?.status === "ACTIVATED";
  const isReplacementPending = Boolean(qrSticker?.replacementPending);

  const nodes = [
    {
      step: "01",
      name: "VEHICLE",
      status: vehicle ? "Connected" : "Missing",
      isReady: Boolean(vehicle),
      isPending: false,
      subtext: vehicle ? `${vehicle.make} ${vehicle.model}` : "Register vehicle",
      icon: "vehicle" as const,
      onClick: onOpenVehicleSheet,
    },
    {
      step: "02",
      name: "QR STICKER",
      status: isReplacementPending
        ? "Replacing"
        : isQrActive
        ? "Active"
        : qrSticker
        ? qrSticker.status
        : "Unassigned",
      isReady: isQrActive,
      isPending: isReplacementPending,
      subtext: isReplacementPending
        ? "Replacement requested"
        : qrSticker
        ? qrSticker.visibleCode
        : "Activate sticker",
      icon: "qr" as const,
      onClick: onOpenQrSheet,
    },
    {
      step: "03",
      name: "SAFETY VIEW",
      status: (safetyProfile.bloodGroup || safetyProfile.medicalNotes || safetyProfile.showVehicleDetails || safetyProfile.showMedicalNotes) ? "Configured" : "Incomplete",
      isReady: Boolean(safetyProfile.bloodGroup || safetyProfile.medicalNotes || safetyProfile.showVehicleDetails || safetyProfile.showMedicalNotes),
      isPending: false,
      subtext: safetyProfile.bloodGroup
        ? `Blood: ${safetyProfile.bloodGroup}`
        : safetyProfile.medicalNotes
        ? "Medical notes set"
        : safetyProfile.showMedicalNotes
        ? "Safety projection active"
        : "Set blood group",
      icon: "shield" as const,
      onClick: onOpenSafetySheet,
    },
    {
      step: "04",
      name: "EMERGENCY CONTACTS",
      status: safetyProfile.contacts.length > 0 ? `${safetyProfile.contacts.length} Active` : "Missing",
      isReady: safetyProfile.contacts.length > 0,
      isPending: false,
      subtext: safetyProfile.contacts[0]?.name || "Add contact",
      icon: "phone" as const,
      onClick: onOpenContactsSheet,
    },
  ];

  return (
    <section aria-label="Identity Readiness Rail" className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] sm:tracking-[0.2em] text-muted-foreground truncate">
          IDENTITY READINESS RAIL &bull; CLICK NODE TO INSPECT
        </div>
        <div className="font-mono text-[10px] text-muted-foreground shrink-0">
          {nodes.filter((n) => n.isReady).length} / 4 VERIFIED
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {nodes.map((node) => (
          <button
            key={node.step}
            type="button"
            onClick={node.onClick}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-3.5 sm:p-4 text-left shadow-2xs transition-all hover:border-[#cc785c]/40 hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-[#cc785c]/30"
          >
            {/* Top Index & Status Dot */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-[10px] font-bold text-muted-foreground shrink-0">
                  {node.step}
                </span>
                <span className="font-mono text-xs font-semibold tracking-wider text-foreground truncate">
                  {node.name}
                </span>
              </div>
              <span
                className={`flex h-2 w-2 shrink-0 rounded-full ${
                  node.isPending
                    ? "bg-[#cc785c] animate-pulse"
                    : node.isReady
                    ? "bg-[#5db8a6]"
                    : "bg-[#e8a55a]"
                }`}
              />
            </div>

            {/* Bottom Content & Arrow */}
            <div className="mt-4 flex items-end justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div
                  className={`font-mono text-sm font-bold truncate ${
                    node.isPending
                      ? "text-[#cc785c]"
                      : node.isReady
                      ? "text-[#5db8a6]"
                      : "text-[#e8a55a]"
                  }`}
                >
                  {node.status}
                </div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {node.subtext}
                </div>
              </div>

              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-all group-hover:bg-[#cc785c]/10 group-hover:text-[#cc785c] group-hover:translate-x-0.5">
                <VaahanIcon name="arrow-right" size={12} />
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
