"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type {
  DashboardVehicle,
  DashboardQrSticker,
  DashboardEmergencyProfile,
} from "@/lib/dashboard-types";

interface VehicleIdentityCoreProps {
  vehicle: DashboardVehicle | null;
  qrSticker: DashboardQrSticker | null;
  safetyProfile: DashboardEmergencyProfile;
  onManageIdentity: () => void;
  onViewQr: () => void;
}

export function VehicleIdentityCore({
  vehicle,
  qrSticker,
  safetyProfile,
  onManageIdentity,
  onViewQr,
}: VehicleIdentityCoreProps) {
  if (!vehicle) {
    return (
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#252320] bg-[#181715] p-5 sm:p-8 text-[#FAF9F5] shadow-xl w-full max-w-full">
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-[#cc785c]">
            <VaahanIcon name="vehicle" size={28} />
          </div>
          <h3 className="mt-4 font-serif text-xl font-medium">No Vehicle Registered</h3>
          <p className="mt-1 max-w-sm text-xs text-[#8E8B82]">
            Register your vehicle to generate your VaahanSafe safety identity, activate your QR sticker, and set up your emergency network.
          </p>
          <a
            href="/vehicles/new"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#cc785c] px-4 py-2 font-mono text-xs font-semibold text-white transition-all hover:bg-[#a9583e]"
          >
            Register Vehicle →
          </a>
        </div>
      </div>
    );
  }

  // Derive readiness
  const isQrActive = qrSticker?.status === "ACTIVE" || qrSticker?.status === "ACTIVATED";
  const isReplacementPending = Boolean(qrSticker?.replacementPending);
  const hasQr = isQrActive;
  const hasContacts = safetyProfile.contacts.length > 0;
  const hasMedical = Boolean(safetyProfile.bloodGroup);

  const readinessScore = [hasQr, hasContacts, hasMedical].filter(Boolean).length;
  const readinessLabel =
    readinessScore === 3
      ? "Fully Protected"
      : readinessScore === 2
      ? "Partially Configured"
      : "Action Required";

  // Derive QR status display & badge styling
  const qrStatusConfig = (() => {
    if (isReplacementPending) {
      const statusLabel = qrSticker?.replacementStatus
        ? ` (${qrSticker.replacementStatus.toLowerCase()})`
        : "";
      return {
        label: `Replacing${statusLabel}`,
        badgeClass: "text-[#cc785c] bg-[#cc785c]/10 border-[#cc785c]/30",
        dotClass: "bg-[#cc785c] animate-pulse",
      };
    }
    if (isQrActive) {
      return {
        label: "QR Active",
        badgeClass: "text-[#5db8a6] bg-[#5db8a6]/10 border-[#5db8a6]/30",
        dotClass: "bg-[#5db8a6]",
      };
    }
    if (qrSticker?.status === "REPLACED") {
      return {
        label: "QR Replaced",
        badgeClass: "text-[#c64545] bg-[#c64545]/10 border-[#c64545]/30",
        dotClass: "bg-[#c64545]",
      };
    }
    if (qrSticker?.status === "PRINTED") {
      return {
        label: "QR In Transit",
        badgeClass: "text-[#e8a55a] bg-[#e8a55a]/10 border-[#e8a55a]/30",
        dotClass: "bg-[#e8a55a]",
      };
    }
    return {
      label: qrSticker ? `QR ${qrSticker.status}` : "QR Unlinked",
      badgeClass: "text-[#e8a55a] bg-[#e8a55a]/10 border-[#e8a55a]/30",
      dotClass: "bg-[#e8a55a]",
    };
  })();

  // Derive vehicle icon based on actual vehicle type
  const vehicleIconName: "motorcycle" | "car" | "truck" | "bus" = (() => {
    const type = vehicle.type?.toLowerCase() || "";
    if (
      type.includes("motorcycle") ||
      type.includes("bike") ||
      type.includes("scooter") ||
      type.includes("two_wheeler") ||
      type.includes("two wheeler") ||
      type.includes("2 wheeler")
    ) {
      return "motorcycle";
    }
    if (type.includes("truck")) return "truck";
    if (type.includes("bus")) return "bus";
    return "car";
  })();

  return (
    <div className="relative flex h-full flex-1 flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-[#252320] bg-[#181715] p-4 sm:p-6 lg:p-7 text-[#FAF9F5] shadow-2xl w-full max-w-full">
      {/* Background Architectural Registration Rails & Subtle Accents */}
      <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-[#cc785c]/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-[#5db8a6]/5 blur-3xl" />
      
      {/* Top Header Rail */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 border-b border-white/10 pb-4 sm:pb-5">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <span className="flex h-2 w-2 shrink-0 rounded-full bg-[#cc785c] animate-pulse" />
          <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-[0.16em] sm:tracking-[0.2em] text-[#8E8B82] uppercase truncate">
            VEHICLE IDENTITY / {vehicle.status}
          </span>
          <span className="font-mono text-[10px] text-white/30 shrink-0">&bull;</span>
          <span className="font-mono text-[10px] text-white/50 shrink-0">{vehicle.type}</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 sm:px-3 py-0.5 sm:py-1 font-mono text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase ${qrStatusConfig.badgeClass}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${qrStatusConfig.dotClass}`} />
            {qrStatusConfig.label}
          </span>
          <button
            type="button"
            onClick={onViewQr}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-medium text-[#FAF9F5] transition-colors hover:border-[#cc785c]/60 hover:bg-[#cc785c]/10"
          >
            <VaahanIcon name="qr" size={13} className="text-[#cc785c]" />
            <span>Inspect QR</span>
          </button>
        </div>
      </div>

      {/* Main Composition */}
      <div className="my-auto grid grid-cols-1 gap-6 sm:grid-cols-12 items-stretch py-3">
        {/* Left cols: Plate & Identity Specs & Readiness Breakdown */}
        <div className="sm:col-span-7 flex flex-col justify-between space-y-4">
          <div>
            <div className="font-mono text-[10px] tracking-[0.2em] text-[#8E8B82] uppercase">
              REGISTERED PLATE ID
            </div>
            <div className="mt-1 flex flex-wrap items-baseline gap-2 sm:gap-3">
              <span className="font-mono text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-wider text-white break-all">
                {vehicle.registrationNumber}
              </span>
              <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#FAF9F5] shrink-0">
                IND
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#8E8B82]">
            <div>
              <span className="text-white/40 font-mono text-[10px] uppercase">Make & Model: </span>
              <span className="font-medium text-white">{vehicle.make} {vehicle.model}</span>
            </div>
            {qrSticker?.visibleCode && (
              <div>
                <span className="text-white/40 font-mono text-[10px] uppercase">Public ID: </span>
                <span className="font-mono font-medium text-[#cc785c]">{qrSticker.visibleCode}</span>
              </div>
            )}
          </div>

          {/* Continuous Identity Readiness Rail Breakdown */}
          <div className="pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-[#8E8B82] uppercase tracking-wider">
              <span>
                Readiness:{" "}
                <strong
                  className={
                    readinessScore === 3
                      ? "text-[#5db8a6]"
                      : readinessScore === 2
                      ? "text-[#e8a55a]"
                      : "text-[#c64545]"
                  }
                >
                  {readinessLabel}
                </strong>
              </span>
              <span>{readinessScore}/3 Checks Passed</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  hasQr ? "bg-[#5db8a6]" : "bg-white/10"
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all ${
                  hasContacts ? "bg-[#5db8a6]" : "bg-white/10"
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all ${
                  hasMedical ? "bg-[#5db8a6]" : "bg-white/10"
                }`}
              />
            </div>

            {/* Granular check badges */}
            <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-[9px]">
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    hasQr
                      ? isReplacementPending
                        ? "bg-[#cc785c]"
                        : "bg-[#5db8a6]"
                      : "bg-white/20"
                  }`}
                />
                <span className="truncate text-[#8E8B82]">
                  {isReplacementPending ? "QR Replacing" : hasQr ? "QR Active" : "No QR"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    hasContacts ? "bg-[#5db8a6]" : "bg-white/20"
                  }`}
                />
                <span className="truncate text-[#8E8B82]">
                  {hasContacts
                    ? `${safetyProfile.contacts.length} Contact${safetyProfile.contacts.length === 1 ? "" : "s"}`
                    : "0 Contacts"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    hasMedical ? "bg-[#5db8a6]" : "bg-white/20"
                  }`}
                />
                <span className="truncate text-[#8E8B82]">
                  {hasMedical ? `Blood: ${safetyProfile.bloodGroup}` : "Blood Unset"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right cols: Vehicle Schematic / Contour Geometry */}
        <div className="flex flex-col items-center justify-between rounded-2xl border border-white/5 bg-[#1F1E1B] p-4 sm:p-5 sm:col-span-5 min-h-[170px]">
          <div className="relative flex flex-1 w-full items-center justify-center py-2">
            {/* Fine Registration Target Geometry */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="h-24 w-24 rounded-full border border-dashed border-white/10" />
              <div className="absolute h-32 w-px bg-white/5" />
              <div className="absolute w-32 h-px bg-white/5" />
            </div>

            {/* Vehicle Contour Icon (Dynamic based on vehicle type) */}
            <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#cc785c]/10 text-[#cc785c] shadow-lg ring-1 ring-[#cc785c]/20">
              <VaahanIcon name={vehicleIconName} size={32} />
            </div>
          </div>

          <div className="mt-2 w-full flex items-center justify-between text-xs border-t border-white/5 pt-3">
            <span className="font-mono text-[10px] text-[#8E8B82] uppercase">
              {vehicle.type} PROFILE
            </span>
            <button
              type="button"
              onClick={onManageIdentity}
              className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-[#cc785c] hover:underline"
            >
              Manage identity →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
