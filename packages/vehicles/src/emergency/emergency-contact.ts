/**
 * VaahanSafe Emergency Contact Domain Model & Prioritization
 *
 * INVARIANTS:
 * - Deterministic priority (1, 2, 3...).
 * - Server-side phone normalization.
 * - Public contacts are action-oriented ("Call Contact", "Message Contact").
 * - Disabled contacts are never projected to finder.
 */

export type EmergencyContactId = string & { readonly __brand: unique symbol };

/**
 * Normalizes an Indian phone number to standard E.164 format (+91XXXXXXXXXX)
 * or clean digits.
 */
export function normalizePhoneNumber(raw: string): string {
  if (!raw) return "";
  const cleaned = raw.trim().replace(/[\s\-().]/g, "");

  if (cleaned.startsWith("+91")) {
    const digits = cleaned.slice(3);
    if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  } else if (cleaned.startsWith("0")) {
    const digits = cleaned.slice(1);
    if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  } else if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }

  // Fallback for valid international numbers
  if (/^\+?[1-9]\d{7,14}$/.test(cleaned)) {
    return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
  }

  return cleaned;
}

/**
 * Formats a normalized phone for human readability (e.g. +91 98765 43210).
 */
export function formatPhoneDisplay(phone: string): string {
  const norm = normalizePhoneNumber(phone);
  if (norm.startsWith("+91") && norm.length === 13) {
    return `+91 ${norm.slice(3, 8)} ${norm.slice(8)}`;
  }
  return norm;
}

export interface EmergencyContact {
  id: string;
  emergencyProfileId: string;
  name: string;
  relationshipLabel: string;
  phoneNormalized: string;
  phoneDisplay: string;
  priority: number; // 1 = Primary, 2 = Secondary, etc.
  isEnabled: boolean;
  allowCall: boolean;
  allowMessage: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmergencyContactParams {
  id?: string;
  emergencyProfileId: string;
  name: string;
  relationshipLabel: string;
  phone: string;
  priority?: number;
  isEnabled?: boolean;
  allowCall?: boolean;
  allowMessage?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Generates an opaque EmergencyContactId (cnt_xxx).
 */
export function generateEmergencyContactId(): EmergencyContactId {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let id = "cnt_";
  for (let i = 0; i < 12; i++) {
    const byte = bytes[i] ?? 0;
    id += chars.charAt(byte % chars.length);
  }
  return id as EmergencyContactId;
}

/**
 * Pure domain factory creating a validated EmergencyContact entity.
 */
export function createEmergencyContact(params: CreateEmergencyContactParams): EmergencyContact {
  if (!params.emergencyProfileId || !params.emergencyProfileId.trim()) {
    throw new Error("Emergency contact must belong to an emergencyProfileId");
  }
  if (!params.name || !params.name.trim()) {
    throw new Error("Emergency contact name is required");
  }
  if (!params.relationshipLabel || !params.relationshipLabel.trim()) {
    throw new Error("Emergency contact relationship is required");
  }

  const phoneNormalized = normalizePhoneNumber(params.phone);
  if (!phoneNormalized) {
    throw new Error("Valid emergency contact phone number is required");
  }

  const priority = params.priority !== undefined ? Math.max(1, Math.min(5, params.priority)) : 1;
  const now = new Date().toISOString();

  return {
    id: params.id || generateEmergencyContactId(),
    emergencyProfileId: params.emergencyProfileId.trim(),
    name: params.name.trim(),
    relationshipLabel: params.relationshipLabel.trim(),
    phoneNormalized,
    phoneDisplay: formatPhoneDisplay(phoneNormalized),
    priority,
    isEnabled: params.isEnabled !== false,
    allowCall: params.allowCall !== false,
    allowMessage: params.allowMessage !== false,
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
  };
}

/**
 * Returns prioritized enabled contacts sorted ascending by priority (1 before 2 before 3).
 */
export function getPrioritizedContacts(
  contacts: EmergencyContact[],
  maxLimit: number = 3
): EmergencyContact[] {
  return [...contacts]
    .filter((c) => c.isEnabled && c.phoneNormalized)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, maxLimit);
}
