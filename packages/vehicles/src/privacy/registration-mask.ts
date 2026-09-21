/**
 * VaahanSafe Vehicle Registration Masking & Projection Policy
 *
 * INVARIANT: Full vehicle registration numbers must not automatically become finder-visible.
 * The masking policy is configurable, privacy-preserving, and centralized.
 */

import { formatRegistrationDisplay, normalizeRegistrationNumber } from "../domain/registration";

export type RegistrationMaskMode = "PARTIAL" | "FULL_MASK" | "UNMASKED" | "HIDDEN";

export interface RegistrationMaskOptions {
  mode?: RegistrationMaskMode;
  maskChar?: string;
}

const STATE_SERIES_REGEX = /^([A-Z]{2})([0-9]{1,2})([A-Z]{0,3})([0-9]{4})$/;
const BH_SERIES_REGEX = /^([0-9]{2})BH([0-9]{4})([A-Z]{1,2})$/;

/**
 * Masks a vehicle registration number according to privacy policy.
 * Default policy: PARTIAL (e.g. "AP 39 AB 1234" -> "AP •• •• 1234")
 */
export function maskVehicleRegistration(
  rawOrNormalized: string,
  options: RegistrationMaskOptions = {}
): string {
  const mode = options.mode ?? "PARTIAL";
  const maskChar = options.maskChar ?? "••";

  if (!rawOrNormalized) {
    return "";
  }

  if (mode === "HIDDEN") {
    return "Registered Vehicle";
  }

  if (mode === "UNMASKED") {
    return formatRegistrationDisplay(rawOrNormalized);
  }

  if (mode === "FULL_MASK") {
    return "••••••••••";
  }

  // PARTIAL Masking Mode (Privacy Default)
  const norm = normalizeRegistrationNumber(rawOrNormalized);
  const stateMatch = norm.match(STATE_SERIES_REGEX);
  if (stateMatch) {
    const [, state, , , number] = stateMatch;
    return `${state} ${maskChar} ${maskChar} ${number}`;
  }

  const bhMatch = norm.match(BH_SERIES_REGEX);
  if (bhMatch) {
    const [, year, , series] = bhMatch;
    return `${year} BH ${maskChar} ${series}`;
  }

  // Fallback for non-standard plates: keep first 2 and last 2, mask middle
  if (norm.length >= 6) {
    const prefix = norm.slice(0, 2);
    const suffix = norm.slice(-4);
    return `${prefix} ${maskChar} ${suffix}`;
  }

  return `${maskChar} ${maskChar}`;
}
