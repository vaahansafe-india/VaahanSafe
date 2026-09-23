"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type { DashboardEmergencyProfile } from "@/lib/dashboard-types";

interface SafetyProjectionMatrixProps {
  profile: DashboardEmergencyProfile;
  onEditSafetyView: () => void;
}

export function SafetyProjectionMatrix({
  profile,
  onEditSafetyView,
}: SafetyProjectionMatrixProps) {
  const fields = [
    {
      id: "vehicle",
      label: "Vehicle Context",
      description: "Make, model & registration plate",
      isPrivate: true,
      isControlled: true,
      isVisible: profile.showVehicleDetails,
    },
    {
      id: "contacts",
      label: "Emergency Contact",
      description:
        profile.contacts.length > 0
          ? `${profile.contacts.length} priority responder${profile.contacts.length === 1 ? "" : "s"} configured`
          : "No emergency contacts configured",
      isPrivate: true,
      isControlled: true,
      isVisible: profile.contacts.length > 0,
    },
    {
      id: "blood",
      label: "Blood Group",
      description: profile.showBloodGroup
        ? profile.bloodGroup
          ? `Type ${profile.bloodGroup}`
          : "Public (Not specified)"
        : "Hidden / Private",
      isPrivate: true,
      isControlled: true,
      isVisible: profile.showBloodGroup,
    },
    {
      id: "medical",
      label: "Medical & Safety Notes",
      description: profile.showMedicalNotes
        ? profile.medicalNotes
          ? "Allergies / critical instructions"
          : "Public (No notes configured)"
        : "Hidden / Private",
      isPrivate: true,
      isControlled: true,
      isVisible: profile.showMedicalNotes,
    },
    {
      id: "owner",
      label: "Owner Identity",
      description: profile.showOwnerName ? "Display name shown" : "Anonymous / masked",
      isPrivate: true,
      isControlled: true,
      isVisible: profile.showOwnerName,
    },
  ];

  return (
    <div className="flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-6 lg:p-7 shadow-sm w-full max-w-full overflow-hidden">
      <div>
        <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2 w-2 shrink-0 rounded-full bg-[#5db8a6]" />
            <h3 className="font-mono text-[11px] sm:text-xs font-bold uppercase tracking-[0.16em] sm:tracking-[0.2em] text-foreground truncate">
              SAFETY PROJECTION MATRIX
            </h3>
          </div>
          <button
            type="button"
            onClick={onEditSafetyView}
            className="flex items-center gap-1 font-mono text-[11px] font-medium text-[#cc785c] hover:underline shrink-0"
          >
            <span>Configure</span>
            <VaahanIcon name="arrow-right" size={12} />
          </button>
        </div>

        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          Authoritative mapping of private account records to public passerby safety view on QR scan.
        </p>

        {/* Matrix Grid */}
        <div className="mt-4 overflow-x-auto no-scrollbar -mx-1 sm:mx-0 px-1 sm:px-0">
          <table className="w-full text-left font-mono text-xs min-w-[280px] sm:min-w-0" role="table">
            <thead>
              <tr className="border-b border-border text-[10px] text-muted-foreground">
                <th className="py-2 pr-2 text-left font-bold uppercase tracking-wider">
                  PROTECTED FIELD
                </th>
                <th className="py-2 px-1 text-center font-bold uppercase tracking-wider w-14 sm:w-20">
                  <span className="hidden sm:inline">PRIVATE</span>
                  <span className="sm:hidden">PVT</span>
                </th>
                <th className="py-2 px-1 text-center font-bold uppercase tracking-wider w-16 sm:w-24">
                  <span className="hidden sm:inline">CONTROLLED</span>
                  <span className="sm:hidden">CTRL</span>
                </th>
                <th className="py-2 px-1 text-center font-bold uppercase tracking-wider w-14 sm:w-20">
                  <span className="hidden sm:inline">VISIBLE</span>
                  <span className="sm:hidden">VIEW</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {fields.map((f) => (
                <tr
                  key={f.id}
                  onClick={onEditSafetyView}
                  className="group cursor-pointer transition-colors hover:bg-muted/50"
                >
                  <td className="py-2.5 pr-2">
                    <div className="font-medium text-foreground group-hover:text-[#cc785c] text-xs leading-snug">
                      {f.label}
                    </div>
                    <div className="text-[10px] text-muted-foreground leading-snug">
                      {f.description}
                    </div>
                  </td>

                  {/* Private State: always stored securely */}
                  <td className="py-2.5 px-1 text-center">
                    <span
                      title="Stored securely in encrypted vault"
                      className="inline-flex h-2 w-2 rounded-full bg-border"
                    />
                  </td>

                  {/* Controlled State: owner has toggled/configured */}
                  <td className="py-2.5 px-1 text-center">
                    <span
                      title="Controlled by vehicle owner"
                      className="inline-flex h-2.5 w-2.5 rounded-full bg-[#cc785c]"
                    />
                  </td>

                  {/* Visible State: visible to public scanner */}
                  <td className="py-2.5 px-1 text-center">
                    {f.isVisible ? (
                      <span
                        title="Publicly visible on QR scan"
                        className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-[#5db8a6]/20 text-[#5db8a6]"
                      >
                        <span className="h-2 w-2 rounded-full bg-[#5db8a6]" />
                      </span>
                    ) : (
                      <span
                        title="Masked/hidden from public view"
                        className="inline-flex h-2 w-2 rounded-full border border-border bg-background"
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-[10px] font-mono text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#5db8a6]" /> Visible
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#cc785c]" /> Controlled
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-border" /> Private
          </span>
        </div>
        <span className="shrink-0 text-[9px] sm:text-[10px]">CLICK ROW TO EDIT</span>
      </div>
    </div>
  );
}
