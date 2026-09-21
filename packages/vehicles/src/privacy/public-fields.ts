/**
 * VaahanSafe Public Field Policy & Never-Public Exclusion Matrix
 *
 * INVARIANTS:
 * - Public fields are strictly enumerated with policy rules and privacy defaults.
 * - Sensitive fields (owner name, blood group, medical notes) are DISABLED by default.
 * - Hard denylist (NEVER_PUBLIC_FIELDS) ensures sensitive account, payment, and auth fields
 *   never cross the boundary into public projections.
 */

import { SENSITIVE_FIELD_WARNING } from "../emergency/medical-information";

export const PUBLIC_FIELDS = [
  "VEHICLE_DISPLAY_IDENTIFIER",
  "VEHICLE_TYPE",
  "VEHICLE_MAKE_MODEL",
  "VEHICLE_PHOTO",
  "OWNER_NAME",
  "EMERGENCY_CONTACT_ACTION",
  "EMERGENCY_CONTACT_NAME",
  "EMERGENCY_CONTACT_RELATIONSHIP",
  "BLOOD_GROUP",
  "MEDICAL_NOTES",
] as const;

export type PublicField = (typeof PUBLIC_FIELDS)[number];

export interface FieldPolicyConfig {
  field: PublicField;
  systemDefault: "ENABLED" | "DISABLED" | "MASKED";
  userCanEnable: boolean;
  userCanDisable: boolean;
  requiresWarning: boolean;
  warningText?: string;
  description: string;
}

export const PUBLIC_FIELD_POLICIES: Record<PublicField, FieldPolicyConfig> = {
  VEHICLE_DISPLAY_IDENTIFIER: {
    field: "VEHICLE_DISPLAY_IDENTIFIER",
    systemDefault: "MASKED",
    userCanEnable: true,
    userCanDisable: false,
    requiresWarning: false,
    description: "Vehicle registration plate identifier (masked by default: AP •• •• 1234)",
  },
  VEHICLE_TYPE: {
    field: "VEHICLE_TYPE",
    systemDefault: "ENABLED",
    userCanEnable: true,
    userCanDisable: false,
    requiresWarning: false,
    description: "Vehicle category (e.g. Car, Motorcycle, Scooter)",
  },
  VEHICLE_MAKE_MODEL: {
    field: "VEHICLE_MAKE_MODEL",
    systemDefault: "ENABLED",
    userCanEnable: true,
    userCanDisable: true,
    requiresWarning: false,
    description: "Make, model and exterior color (e.g. Hyundai Creta • Polar White)",
  },
  VEHICLE_PHOTO: {
    field: "VEHICLE_PHOTO",
    systemDefault: "DISABLED",
    userCanEnable: true,
    userCanDisable: true,
    requiresWarning: false,
    description: "Public vehicle photograph for visual identification",
  },
  OWNER_NAME: {
    field: "OWNER_NAME",
    systemDefault: "DISABLED",
    userCanEnable: true,
    userCanDisable: true,
    requiresWarning: true,
    warningText: SENSITIVE_FIELD_WARNING,
    description: "Owner display name (HIDDEN by default)",
  },
  EMERGENCY_CONTACT_ACTION: {
    field: "EMERGENCY_CONTACT_ACTION",
    systemDefault: "ENABLED",
    userCanEnable: true,
    userCanDisable: false,
    requiresWarning: false,
    description: "Direct call or message action for verified emergency contacts",
  },
  EMERGENCY_CONTACT_NAME: {
    field: "EMERGENCY_CONTACT_NAME",
    systemDefault: "ENABLED",
    userCanEnable: true,
    userCanDisable: false,
    requiresWarning: false,
    description: "First name or label of emergency contact",
  },
  EMERGENCY_CONTACT_RELATIONSHIP: {
    field: "EMERGENCY_CONTACT_RELATIONSHIP",
    systemDefault: "ENABLED",
    userCanEnable: true,
    userCanDisable: false,
    requiresWarning: false,
    description: "Relationship label (e.g. Spouse, Parent, Doctor)",
  },
  BLOOD_GROUP: {
    field: "BLOOD_GROUP",
    systemDefault: "DISABLED",
    userCanEnable: true,
    userCanDisable: true,
    requiresWarning: true,
    warningText: SENSITIVE_FIELD_WARNING,
    description: "Self-reported blood group (HIDDEN by default)",
  },
  MEDICAL_NOTES: {
    field: "MEDICAL_NOTES",
    systemDefault: "DISABLED",
    userCanEnable: true,
    userCanDisable: true,
    requiresWarning: true,
    warningText: SENSITIVE_FIELD_WARNING,
    description: "Emergency safety instructions & allergies (HIDDEN by default)",
  },
};

/**
 * Hard denylist / structural exclusion.
 * Any key in this list MUST NEVER enter a PublicEmergencyProfile projection.
 */
export const NEVER_PUBLIC_FIELDS = [
  "email",
  "phone", // Account verified mobile
  "address",
  "homeAddress",
  "billingAddress",
  "shippingAddress",
  "savedLocation",
  "authIdentity",
  "googleIdentity",
  "session",
  "token",
  "otp",
  "accountSettings",
  "orders",
  "payments",
  "refunds",
  "supportTickets",
  "adminNotes",
  "privateR2Key",
  "userId",
  "customerId",
  "chassisNumber",
  "engineNumber",
  "insurancePolicyNumber",
  "insuranceExpiryDate",
  "fraudSignals",
  "subscriptionMeta",
] as const;

export type NeverPublicField = (typeof NEVER_PUBLIC_FIELDS)[number];
