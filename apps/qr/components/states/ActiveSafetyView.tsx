import React from "react";
import { VerifiedVehicleHero } from "../identity/VerifiedVehicleHero";
import { ProjectionBoundary } from "../projection/ProjectionBoundary";
import { SafetyField } from "../projection/SafetyField";
import { MedicalInformation } from "../projection/MedicalInformation";
import { PrimarySafetyContact } from "../contacts/PrimarySafetyContact";
import { SecondarySafetyContact } from "../contacts/SecondarySafetyContact";
import type { PublicQrResolution } from "@vaahansafe/qr-core";
import { ReportEntry } from "../reports/ReportEntry";

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
    <div className="w-full min-w-0 space-y-5 animate-in fade-in duration-300 sm:space-y-6">
      <VerifiedVehicleHero
        profile={profile}
        publicId={publicId}
        visibleCode={visibleCode}
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
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-0.5">
          <h2 className="font-serif text-2xl text-foreground">
            Emergency contacts
          </h2>
          <span className="text-xs text-muted-foreground">
            {profile.approvedEmergencyContacts.length} approved{" "}
            {profile.approvedEmergencyContacts.length === 1
              ? "contact"
              : "contacts"}
          </span>
        </div>

        {primaryContact ? (
          <div className="space-y-2.5">
            <PrimarySafetyContact
              contact={primaryContact}
              publicId={publicId}
            />

            {secondaryContacts.map((contact, idx) => (
              <SecondarySafetyContact
                key={contact.id || idx}
                contact={contact}
                index={idx}
                publicId={publicId}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-border/80 text-center text-xs text-muted-foreground">
            No emergency contact numbers have been configured by the owner.
          </div>
        )}
      </div>
      <ReportEntry
        publicId={publicId}
        vehicleDisplay={profile.vehicleDisplay}
        siteKey={
          process.env.TURNSTILE_SITE_KEY ||
          process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
          ""
        }
      />
    </div>
  );
}
