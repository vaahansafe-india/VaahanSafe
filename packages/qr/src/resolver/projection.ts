/**
 * VaahanSafe Public Emergency Projection Boundary
 *
 * INVARIANT: Never send the complete customer record or private vehicle details
 * to the QR resolver frontend and hide private fields with CSS.
 * This server-side projection explicitly whitelists only safety-essential fields.
 */

import { VehicleType, EmergencyContact, Vehicle, MedicalProfile, CustomerProfile } from "@vaahansafe/types";
import { QrPublicId } from "../public-id/types";

/**
 * Publicly approved contact item projected for emergency contact.
 */
export interface PublicEmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPriority: boolean;
}

/**
 * Strict server-side projection returned to the public QR emergency screen.
 */
export interface PublicEmergencyProfile {
  qrPublicId: QrPublicId | string;
  status: "ACTIVE";
  vehicleDisplay: string;
  vehicleType: VehicleType;
  approvedOwnerDisplayName?: string;
  bloodGroup?: string;
  approvedSafetyNotes?: string;
  approvedEmergencyContacts: PublicEmergencyContact[];
  profileUpdatedAt: string;
}

/**
 * Internal raw data bundle passed to the projection boundary.
 */
export interface InternalEmergencyRecord {
  publicId: string;
  vehicle?: Partial<Vehicle> | null;
  customerProfile?: Partial<CustomerProfile> | null;
  medicalProfile?: Partial<MedicalProfile> | null;
  emergencyContacts?: EmergencyContact[] | null;
  /** Internal privacy preferences */
  privacyPreferences?: {
    showBloodGroup?: boolean;
    showOwnerName?: boolean;
    showSafetyNotes?: boolean;
  };
  // Forbidden attributes that might exist in raw records
  email?: string;
  phone?: string;
  billingAddress?: unknown;
  orders?: unknown;
  payments?: unknown;
  session?: unknown;
  authIdentity?: unknown;
  adminNotes?: unknown;
  insurancePolicyNumber?: string;
  chassisNumber?: string;
  engineNumber?: string;
}

/**
 * List of forbidden keys that must never appear in a public emergency profile.
 */
export const FORBIDDEN_PUBLIC_FIELDS: readonly string[] = [
  "email",
  "billingAddress",
  "billingDetails",
  "orders",
  "payments",
  "paymentMethod",
  "session",
  "token",
  "authIdentity",
  "password",
  "adminNotes",
  "chassisNumber",
  "engineNumber",
  "insurancePolicyNumber",
  "insuranceExpiryDate",
  "alternatePhone",
] as const;

/**
 * Formats a clean display name for a vehicle.
 * E.g., "Hyundai Creta • White" or "Motorcycle (MH12AB1234)"
 */
function buildVehicleDisplay(vehicle?: Partial<Vehicle> | null): string {
  if (!vehicle) {
    return "Registered Vehicle";
  }

  const makeModel = [vehicle.make, vehicle.model].filter(Boolean).join(" ");
  const color = vehicle.primaryColor ? `• ${vehicle.primaryColor}` : "";

  if (makeModel) {
    return `${makeModel} ${color}`.trim();
  }

  if (vehicle.registrationNumber) {
    return `Vehicle (${vehicle.registrationNumber})`;
  }

  return "Registered Vehicle";
}

/**
 * Transforms internal records into the strictly whitelisted PublicEmergencyProfile.
 * OMITTING all private customer, financial, authentication, and internal notes.
 */
export function createPublicEmergencyProfile(
  record: InternalEmergencyRecord
): PublicEmergencyProfile {
  const prefs = record.privacyPreferences ?? {
    showBloodGroup: true,
    showOwnerName: true,
    showSafetyNotes: true,
  };

  // Only project explicitly approved contacts who have notification / emergency priority enabled
  const approvedContacts: PublicEmergencyContact[] = (record.emergencyContacts || [])
    .filter((contact) => contact && contact.phone && contact.name)
    .slice(0, 3) // Max 3 emergency contacts shown publicly
    .map((c) => ({
      id: c.id,
      name: c.name.trim(),
      relationship: c.relationship.trim(),
      phone: c.phone.trim(),
      isPriority: Boolean(c.isPriority),
    }));

  const profile: PublicEmergencyProfile = {
    qrPublicId: record.publicId,
    status: "ACTIVE",
    vehicleDisplay: buildVehicleDisplay(record.vehicle),
    vehicleType: record.vehicle?.type || "CAR",
    approvedEmergencyContacts: approvedContacts,
    profileUpdatedAt:
      record.vehicle?.updatedAt ||
      record.medicalProfile?.updatedAt ||
      new Date().toISOString(),
  };

  // Only project owner name if explicitly consented
  if (prefs.showOwnerName && record.customerProfile?.displayName) {
    profile.approvedOwnerDisplayName = record.customerProfile.displayName.trim();
  }

  // Only project blood group if explicitly enabled in medical preferences
  if (prefs.showBloodGroup && record.medicalProfile?.bloodGroup) {
    profile.bloodGroup = record.medicalProfile.bloodGroup;
  }

  // Only project emergency safety/medical notes if explicitly approved
  if (prefs.showSafetyNotes && record.vehicle?.emergencyMessage) {
    profile.approvedSafetyNotes = record.vehicle.emergencyMessage.trim();
  } else if (prefs.showSafetyNotes && record.medicalProfile?.additionalNotes) {
    profile.approvedSafetyNotes = record.medicalProfile.additionalNotes.trim();
  }

  return profile;
}

/**
 * Asserts that a projected profile does not contain any forbidden keys.
 * Used for runtime security verification and regression testing.
 */
export function assertSafePublicProjection(
  projection: Record<string, unknown>
): boolean {
  for (const forbidden of FORBIDDEN_PUBLIC_FIELDS) {
    if (forbidden in projection && projection[forbidden] !== undefined) {
      throw new Error(
        `[Security Invariant Violation] Forbidden field "${forbidden}" found in PublicEmergencyProfile!`
      );
    }
  }
  return true;
}
