/**
 * VaahanSafe Emergency Profile Domain Entity
 *
 * INVARIANTS:
 * - Separate entity from Account Profile and Vehicle Profile.
 * - Privacy defaults are STRICTLY privacy-preserving:
 *     - showOwnerName: false (HIDDEN)
 *     - showBloodGroup: false (HIDDEN)
 *     - showMedicalNotes: false (HIDDEN)
 *     - showVehicleDetails: true (Brand & model context)
 *     - maskRegistration: true (MASKED by default)
 */

import { BloodGroup, sanitizeMedicalNotes } from "./medical-information";

export type EmergencyProfileId = string & { readonly __brand: unique symbol };

export type EmergencyProfileStatus = "ACTIVE" | "PAUSED" | "DISABLED";

export interface EmergencyProfilePrivacySettings {
  showOwnerName: boolean;
  showBloodGroup: boolean;
  showMedicalNotes: boolean;
  showVehicleDetails: boolean;
  maskRegistration: boolean;
}

export const DEFAULT_PRIVACY_SETTINGS: EmergencyProfilePrivacySettings = {
  showOwnerName: false,
  showBloodGroup: false,
  showMedicalNotes: false,
  showVehicleDetails: true,
  maskRegistration: true,
};

export interface EmergencyProfile {
  id: string;
  vehicleId: string;
  displayName?: string;
  bloodGroup?: BloodGroup;
  medicalNotes?: string;
  publicVehicleDetails?: string;
  privacy: EmergencyProfilePrivacySettings;
  status: EmergencyProfileStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmergencyProfileParams {
  id?: string;
  vehicleId: string;
  displayName?: string;
  bloodGroup?: BloodGroup;
  medicalNotes?: string;
  publicVehicleDetails?: string;
  privacy?: Partial<EmergencyProfilePrivacySettings>;
  status?: EmergencyProfileStatus;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Generates an opaque EmergencyProfileId (emg_xxx).
 */
export function generateEmergencyProfileId(): EmergencyProfileId {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let id = "emg_";
  for (let i = 0; i < 12; i++) {
    const byte = bytes[i] ?? 0;
    id += chars.charAt(byte % chars.length);
  }
  return id as EmergencyProfileId;
}

/**
 * Factory creating an EmergencyProfile with strict privacy defaults.
 */
export function createEmergencyProfile(params: CreateEmergencyProfileParams): EmergencyProfile {
  if (!params.vehicleId || !params.vehicleId.trim()) {
    throw new Error("Emergency profile must be linked to a vehicleId");
  }

  const now = new Date().toISOString();

  // Merge privacy options over strictly privacy-preserving defaults
  const privacy: EmergencyProfilePrivacySettings = {
    showOwnerName: params.privacy?.showOwnerName ?? DEFAULT_PRIVACY_SETTINGS.showOwnerName,
    showBloodGroup: params.privacy?.showBloodGroup ?? DEFAULT_PRIVACY_SETTINGS.showBloodGroup,
    showMedicalNotes: params.privacy?.showMedicalNotes ?? DEFAULT_PRIVACY_SETTINGS.showMedicalNotes,
    showVehicleDetails: params.privacy?.showVehicleDetails ?? DEFAULT_PRIVACY_SETTINGS.showVehicleDetails,
    maskRegistration: params.privacy?.maskRegistration ?? DEFAULT_PRIVACY_SETTINGS.maskRegistration,
  };

  return {
    id: params.id || generateEmergencyProfileId(),
    vehicleId: params.vehicleId.trim(),
    displayName: params.displayName?.trim() || undefined,
    bloodGroup: params.bloodGroup || undefined,
    medicalNotes: params.medicalNotes ? sanitizeMedicalNotes(params.medicalNotes) : undefined,
    publicVehicleDetails: params.publicVehicleDetails?.trim() || undefined,
    privacy,
    status: params.status || "ACTIVE",
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
  };
}
