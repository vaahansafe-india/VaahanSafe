import React from "react";
import { SafetyIdentityRail } from "../identity/SafetyIdentityRail";
import { QrIdentityBadge } from "../identity/QrIdentityBadge";
import { VehicleIdentity } from "../identity/VehicleIdentity";
import { ProjectionBoundary } from "../projection/ProjectionBoundary";
import { SafetyField } from "../projection/SafetyField";
import { MedicalInformation } from "../projection/MedicalInformation";
import { PrimarySafetyContact } from "../contacts/PrimarySafetyContact";
import { SecondarySafetyContact } from "../contacts/SecondarySafetyContact";
import type { PublicQrResolution } from "@vaahansafe/qr-core";

export interface ActiveSafetyViewProps {
  resolution: PublicQrResolution;
}

export function ActiveSafetyView({ resolution }: ActiveSafetyViewProps) {
  const { publicId, visibleCode, profile } = resolution;

  if (!profile) {
    return null;
  }

  const primaryContact = profile.approvedEmergencyContacts[0];
  const secondaryContacts = profile.approvedEmergencyContacts.slice(1);

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-300">
      {/* 1. Milestone Status Rail (Rule 15, 18) */}
      <SafetyIdentityRail currentStage="VIEW" />

      {/* 2. QR Identity Monospace Badge (Rule 17, 20) */}
      <QrIdentityBadge
        publicId={publicId}
        visibleCode={visibleCode}
        statusLabel="ACTIVE PASS"
      />

      {/* 3. Safe Public Vehicle Representation (Rule 20) */}
      <VehicleIdentity
        vehicleDisplay={profile.vehicleDisplay}
        vehicleType={profile.vehicleType}
      />

      {/* 4. Controlled Public Safety Projection (Rule 10, 11, 37) */}
      <ProjectionBoundary>
        <SafetyField
          label="Registered Owner"
          value={profile.approvedOwnerDisplayName}
        />

        <SafetyField
          label="Blood Group"
          value={profile.bloodGroup}
          isBloodGroup
        />

        <MedicalInformation notes={profile.approvedSafetyNotes} />
      </ProjectionBoundary>

      {/* 5. Emergency Contacts Section (Rule 21, 22, 23) */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-0.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Emergency Contacts ({profile.approvedEmergencyContacts.length})
          </span>
          <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-medium">
            Active Relay
          </span>
        </div>

        {primaryContact ? (
          <div className="space-y-2.5">
            <PrimarySafetyContact contact={primaryContact} />

            {secondaryContacts.map((contact, idx) => (
              <SecondarySafetyContact
                key={contact.id || idx}
                contact={contact}
                index={idx}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-border/80 text-center text-xs text-muted-foreground">
            No emergency contact numbers have been configured by the owner.
          </div>
        )}
      </div>
    </div>
  );
}
