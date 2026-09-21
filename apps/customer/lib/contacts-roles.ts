import type { VaahanIconName } from "@vaahansafe/icons";
import type { ContactRoleType } from "./contacts-types";

/**
 * Authoritative mapping from domain ContactRoleType to VaahanIcon names.
 * Uses Hugeicons strictly through @vaahansafe/icons registry.
 */
export const ROLE_ICON_MAP: Record<ContactRoleType, VaahanIconName> = {
  PARENT: "user",
  SPOUSE_PARTNER: "users",
  SIBLING: "users",
  CHILD: "user",
  GUARDIAN: "shield",
  FRIEND: "users",
  RELATIVE: "users",
  COLLEAGUE: "id-card",
  DOCTOR_MEDICAL: "activity",
  OTHER: "user",
};

/**
 * Canonical metadata for all 10 supported contact roles.
 */
export const ROLE_DEFINITIONS: Array<{
  type: ContactRoleType;
  label: string;
  descriptor: string;
  iconName: VaahanIconName;
}> = [
  {
    type: "PARENT",
    label: "Parent",
    descriptor: "Mother or Father",
    iconName: "user",
  },
  {
    type: "SPOUSE_PARTNER",
    label: "Spouse / Partner",
    descriptor: "Husband, Wife, or Partner",
    iconName: "users",
  },
  {
    type: "SIBLING",
    label: "Sibling",
    descriptor: "Brother or Sister",
    iconName: "users",
  },
  {
    type: "CHILD",
    label: "Child",
    descriptor: "Son or Daughter",
    iconName: "user",
  },
  {
    type: "GUARDIAN",
    label: "Guardian",
    descriptor: "Appointed or trusted guardian",
    iconName: "shield",
  },
  {
    type: "FRIEND",
    label: "Friend",
    descriptor: "Close personal friend",
    iconName: "users",
  },
  {
    type: "RELATIVE",
    label: "Relative",
    descriptor: "Extended family member",
    iconName: "users",
  },
  {
    type: "COLLEAGUE",
    label: "Colleague",
    descriptor: "Work colleague or co-driver",
    iconName: "id-card",
  },
  {
    type: "DOCTOR_MEDICAL",
    label: "Doctor / Medical Contact",
    descriptor: "Primary physician or clinic contact",
    iconName: "activity",
  },
  {
    type: "OTHER",
    label: "Other",
    descriptor: "Other trusted connection",
    iconName: "user",
  },
];

/**
 * Normalizes an arbitrary owner-entered relationship label into a canonical ContactRoleType.
 * Preserves the original text for presentation while allowing deterministic icon mapping.
 */
export function normalizeRelationshipToRole(rawLabel?: string | null): ContactRoleType {
  if (!rawLabel) return "OTHER";
  const cleaned = rawLabel.trim().toUpperCase();

  if (
    cleaned.includes("PARENT") ||
    cleaned.includes("FATHER") ||
    cleaned.includes("MOTHER") ||
    cleaned.includes("DAD") ||
    cleaned.includes("MOM") ||
    cleaned.includes("PAPA") ||
    cleaned.includes("MAA")
  ) {
    return "PARENT";
  }
  if (
    cleaned.includes("SPOUSE") ||
    cleaned.includes("PARTNER") ||
    cleaned.includes("WIFE") ||
    cleaned.includes("HUSBAND")
  ) {
    return "SPOUSE_PARTNER";
  }
  if (
    cleaned.includes("SIBLING") ||
    cleaned.includes("BROTHER") ||
    cleaned.includes("SISTER") ||
    cleaned.includes("BHAI") ||
    cleaned.includes("BEHEN")
  ) {
    return "SIBLING";
  }
  if (
    cleaned.includes("CHILD") ||
    cleaned.includes("SON") ||
    cleaned.includes("DAUGHTER") ||
    cleaned.includes("KID")
  ) {
    return "CHILD";
  }
  if (cleaned.includes("GUARDIAN") || cleaned.includes("CARETAKER")) {
    return "GUARDIAN";
  }
  if (
    cleaned.includes("FRIEND") ||
    cleaned.includes("DOST") ||
    cleaned.includes("BUDDY") ||
    cleaned.includes("PAL")
  ) {
    return "FRIEND";
  }
  if (
    cleaned.includes("RELATIVE") ||
    cleaned.includes("COUSIN") ||
    cleaned.includes("UNCLE") ||
    cleaned.includes("AUNT") ||
    cleaned.includes("CHACHA") ||
    cleaned.includes("MAMA")
  ) {
    return "RELATIVE";
  }
  if (
    cleaned.includes("COLLEAGUE") ||
    cleaned.includes("COWORKER") ||
    cleaned.includes("WORK") ||
    cleaned.includes("DRIVER") ||
    cleaned.includes("MANAGER") ||
    cleaned.includes("OFFICE")
  ) {
    return "COLLEAGUE";
  }
  if (
    cleaned.includes("DOCTOR") ||
    cleaned.includes("MEDICAL") ||
    cleaned.includes("PHYSICIAN") ||
    cleaned.includes("HOSPITAL") ||
    cleaned.includes("CLINIC") ||
    cleaned.includes("DR.") ||
    cleaned.includes("DR ")
  ) {
    return "DOCTOR_MEDICAL";
  }

  return "OTHER";
}
