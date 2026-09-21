/**
 * VaahanSafe Server-Side Public Emergency Projection Builder
 *
 * ARCHITECTURAL INVARIANTS:
 * 1. Account data != Vehicle data != Emergency data != Finder-visible data.
 * 2. PublicEmergencyProfile does NOT extend User, Vehicle, or EmergencyProfile.
 * 3. Constructed via STRICT ALLOWLIST. Spreading input entities is strictly forbidden.
 * 4. Future private fields on internal entities cannot leak automatically.
 * 5. Owner name, blood group, and medical notes are HIDDEN by default.
 * 6. Hard denylist validation (assertSafePublicProjection) ensures zero leaks.
 */

import { Vehicle } from "../domain/vehicle";
import { VehicleType } from "../domain/vehicle-type";
import { EmergencyProfile } from "../emergency/emergency-profile";
import { EmergencyContact, getPrioritizedContacts } from "../emergency/emergency-contact";
import { BloodGroup, MEDICAL_DISCLAIMER } from "../emergency/medical-information";
import { maskVehicleRegistration } from "./registration-mask";
import { NEVER_PUBLIC_FIELDS } from "./public-fields";
import { ForbiddenFieldLeakageError } from "../errors/vehicle-errors";

export interface PublicEmergencyContactAction {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  allowCall: boolean;
  allowMessage: boolean;
  isPriority: boolean;
}

export interface PublicVehicleProjection {
  displayIdentifier?: string;
  type: VehicleType;
  makeModel?: string;
  color?: string;
  photoAssetId?: string;
}

export interface PublicEmergencyProjectionData {
  contacts: PublicEmergencyContactAction[];
  bloodGroup?: BloodGroup;
  medicalNotes?: string;
}

export interface PublicSafetyProjectionMeta {
  profileUpdatedAt: string;
  disclaimer: string;
}

/**
 * Authoritative Public Emergency Profile DTO returned to the finder screen.
 */
export interface PublicEmergencyProfile {
  qrPublicId: string;
  status: "ACTIVE";
  vehicle: PublicVehicleProjection;
  ownerDisplayName?: string;
  emergency: PublicEmergencyProjectionData;
  safety: PublicSafetyProjectionMeta;
  // Legacy compatibility fields for seamless Phase 08 resolver consumption
  vehicleDisplay: string;
  vehicleType: VehicleType;
  approvedOwnerDisplayName?: string;
  bloodGroup?: string;
  approvedSafetyNotes?: string;
  approvedEmergencyContacts: {
    id: string;
    name: string;
    relationship: string;
    phone: string;
    isPriority: boolean;
  }[];
  profileUpdatedAt: string;
}

export interface BuildPublicProjectionInput {
  qrPublicId: string;
  vehicle: Vehicle;
  emergencyProfile?: EmergencyProfile | null;
  contacts?: EmergencyContact[] | null;
  rawOwnerDisplayName?: string;
  allowVehiclePhoto?: boolean;
}

/**
 * Builds the finder-safe PublicEmergencyProfile using explicit allowlist construction.
 */
export function buildPublicEmergencyProfile(input: BuildPublicProjectionInput): PublicEmergencyProfile {
  const { qrPublicId, vehicle, emergencyProfile, contacts = [], rawOwnerDisplayName, allowVehiclePhoto } = input;

  const privacy = emergencyProfile?.privacy ?? {
    showOwnerName: false,
    showBloodGroup: false,
    showMedicalNotes: false,
    showVehicleDetails: true,
    maskRegistration: true,
  };

  // 1. Vehicle Context Projection (allowlist only)
  let displayIdentifier: string | undefined;
  if (privacy.maskRegistration) {
    displayIdentifier = maskVehicleRegistration(vehicle.registrationNumberNormalized, { mode: "PARTIAL" });
  } else {
    displayIdentifier = vehicle.registrationNumberDisplay;
  }

  const makeModel = privacy.showVehicleDetails
    ? [vehicle.make, vehicle.model, vehicle.variant].filter(Boolean).join(" ")
    : undefined;

  const color = privacy.showVehicleDetails ? vehicle.color : undefined;

  const vehicleProjection: PublicVehicleProjection = {
    displayIdentifier,
    type: vehicle.vehicleType,
    makeModel,
    color,
    photoAssetId: allowVehiclePhoto && vehicle.photoAssetId ? vehicle.photoAssetId : undefined,
  };

  // 2. Owner Context: ONLY if explicitly consented
  let ownerDisplayName: string | undefined;
  if (privacy.showOwnerName && (rawOwnerDisplayName || emergencyProfile?.displayName)) {
    ownerDisplayName = (rawOwnerDisplayName || emergencyProfile?.displayName)?.trim();
  }

  // 3. Emergency Contacts: ONLY enabled contacts, priority sorted, max 3
  const prioritized = getPrioritizedContacts(contacts || [], 3);
  const projectedContacts: PublicEmergencyContactAction[] = prioritized.map((c) => ({
    id: c.id,
    name: c.name,
    relationship: c.relationshipLabel,
    phone: c.phoneNormalized,
    allowCall: c.allowCall,
    allowMessage: c.allowMessage,
    isPriority: c.priority === 1,
  }));

  // 4. Sensitive Medical Information: ONLY if explicitly opted-in
  let bloodGroup: BloodGroup | undefined;
  if (privacy.showBloodGroup && emergencyProfile?.bloodGroup) {
    bloodGroup = emergencyProfile.bloodGroup;
  }

  let medicalNotes: string | undefined;
  if (privacy.showMedicalNotes && emergencyProfile?.medicalNotes) {
    medicalNotes = emergencyProfile.medicalNotes;
  }

  const profileUpdatedAt = emergencyProfile?.updatedAt || vehicle.updatedAt || new Date().toISOString();

  // Legacy vehicleDisplay string for compatibility
  const vehicleDisplay = makeModel
    ? `${makeModel}${color ? ` • ${color}` : ""}`
    : displayIdentifier || "Registered Vehicle";

  // Construct independent PublicEmergencyProfile DTO (NO SPREADING OF RAW OBJECTS)
  const projection: PublicEmergencyProfile = {
    qrPublicId,
    status: "ACTIVE",
    vehicle: vehicleProjection,
    ownerDisplayName,
    emergency: {
      contacts: projectedContacts,
      bloodGroup,
      medicalNotes,
    },
    safety: {
      profileUpdatedAt,
      disclaimer: MEDICAL_DISCLAIMER,
    },
    // Compatibility fields
    vehicleDisplay,
    vehicleType: vehicle.vehicleType,
    approvedOwnerDisplayName: ownerDisplayName,
    bloodGroup: bloodGroup ? String(bloodGroup) : undefined,
    approvedSafetyNotes: medicalNotes,
    approvedEmergencyContacts: projectedContacts.map((c) => ({
      id: c.id,
      name: c.name,
      relationship: c.relationship,
      phone: c.phone,
      isPriority: c.isPriority,
    })),
    profileUpdatedAt,
  };

  // Runtime verification: ensure no forbidden fields leaked
  assertSafePublicProjection(projection as unknown as Record<string, unknown>);

  return projection;
}

/**
 * Asserts that the projection does not contain any forbidden keys from NEVER_PUBLIC_FIELDS.
 * Throws ForbiddenFieldLeakageError if an invariant violation is detected.
 */
export function assertSafePublicProjection(projection: Record<string, unknown>): boolean {
  if (!projection || typeof projection !== "object") {
    return true;
  }

  for (const field of NEVER_PUBLIC_FIELDS) {
    if (field in projection && projection[field] !== undefined) {
      throw new ForbiddenFieldLeakageError(field);
    }
  }

  return true;
}
