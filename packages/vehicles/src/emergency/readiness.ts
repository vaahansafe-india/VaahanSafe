/**
 * VaahanSafe Emergency Profile Readiness Policy
 *
 * INVARIANTS:
 * - Minimum readiness requires:
 *   1. Active vehicle.
 *   2. Active emergency profile.
 *   3. At least ONE enabled emergency contact with valid phone.
 * - Blood group and medical notes are NEVER required for readiness (strictly optional).
 */

import { Vehicle } from "../domain/vehicle";
import { EmergencyProfile } from "./emergency-profile";
import { EmergencyContact } from "./emergency-contact";

export interface EmergencyProfileReadinessResult {
  ready: boolean;
  reasons: string[];
}

export interface EmergencyReadinessInput {
  vehicle: Vehicle;
  emergencyProfile?: EmergencyProfile | null;
  contacts?: EmergencyContact[] | null;
}

/**
 * Centrally evaluates whether a vehicle's emergency profile is ready for active QR resolution.
 */
export function isEmergencyProfileReady(input: EmergencyReadinessInput): EmergencyProfileReadinessResult {
  const reasons: string[] = [];

  // 1. Vehicle check
  if (!input.vehicle) {
    reasons.push("Vehicle record is missing");
  } else if (input.vehicle.status !== "ACTIVE") {
    reasons.push(`Vehicle is not active (status: ${input.vehicle.status})`);
  }

  // 2. Emergency Profile check
  if (!input.emergencyProfile) {
    reasons.push("Emergency profile does not exist for this vehicle");
  } else if (input.emergencyProfile.status !== "ACTIVE") {
    reasons.push(`Emergency profile is not active (status: ${input.emergencyProfile.status})`);
  }

  // 3. Contacts check: Must have at least one enabled contact with phone
  const usableContacts = (input.contacts || []).filter(
    (c) => c.isEnabled && c.phoneNormalized && c.phoneNormalized.trim().length > 0
  );

  if (usableContacts.length === 0) {
    reasons.push("At least one enabled emergency contact is required");
  }

  return {
    ready: reasons.length === 0,
    reasons,
  };
}
