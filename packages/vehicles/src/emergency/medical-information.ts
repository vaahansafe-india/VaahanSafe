/**
 * VaahanSafe Medical Information & Sensitive Safety Data Policy
 *
 * INVARIANTS:
 * - Blood group is sensitive, user-controlled, and HIDDEN by default.
 * - Medical notes are sensitive, user-controlled, and HIDDEN by default.
 * - Enabling medical notes requires clear warning context.
 * - Medical information is self-reported, not clinically verified diagnosis.
 * - Bounded length (max 500 chars) and strictly sanitized against XSS.
 */

export const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;

export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const MAX_MEDICAL_NOTES_LENGTH = 500;

export const SENSITIVE_FIELD_WARNING =
  "Information enabled here may be visible to anyone who scans your active VaahanSafe QR.";

export const MEDICAL_DISCLAIMER =
  "Emergency information is user-provided and not clinically verified by VaahanSafe. Use in emergency assistance only.";

/**
 * Validates whether a value is a valid BloodGroup.
 */
export function isBloodGroup(val: unknown): val is BloodGroup {
  return typeof val === "string" && (BLOOD_GROUPS as readonly string[]).includes(val);
}

/**
 * Sanitizes medical notes:
 * - Enforces bounded length (max 500 chars).
 * - Strips any HTML tags or script injection attempts.
 * - Trims whitespace.
 */
export function sanitizeMedicalNotes(notes: string): string {
  if (!notes) return "";

  // Strip HTML tags (<...>) and trim
  const clean = notes
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .trim();

  if (clean.length > MAX_MEDICAL_NOTES_LENGTH) {
    return clean.slice(0, MAX_MEDICAL_NOTES_LENGTH).trim();
  }

  return clean;
}
