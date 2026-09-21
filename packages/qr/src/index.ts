/**
 * @vaahansafe/qr-core
 * Authoritative QR Domain, Lifecycle State Machine, Secret Security & Resolver Subsystem
 */

import type { QrLifecycleState, QrSticker, Vehicle, EmergencyContact } from "@vaahansafe/types";

// ==========================================
// Phase 08 Canonical Domain Modules
// ==========================================

// 1. Identity & Permanent Contract
export * from "./identity/public-id";
export * from "./identity/visible-code";
export * from "./identity/qr-url";

// 2. Lifecycle & State Machine
export * from "./lifecycle/qr-status";
export * from "./lifecycle/transitions";
export * from "./lifecycle/public-state";

// 3. Secret Cryptography & Security Policies
export * from "./secrets/generate-secret";
export * from "./secrets/hash-secret";
export * from "./secrets/verify-secret";
export * from "./secrets/secret-policy";

// 4. Domain Errors
export * from "./errors/qr-errors";

// 5. Resolver Projection & Public Resolver Subsystem
export * from "./resolver/projection";
export * from "./resolver/types";
export * from "./resolver/states";
export * from "./resolver/resolve-public-qr";
export * from "./resolver/telemetry";
export * from "./resolver/validate-payload";

// 6. Centralized Service Entitlements & Hard Gates
export * from "./entitlement/service-entitlement";

// 7. Standards-Compliant QR Encoder
export * from "./rendering/qr-encoder";

export const QR_LIFECYCLE_STATES: readonly QrLifecycleState[] = [
  "PRINTED",
  "IN_TRANSIT_DISTRIBUTOR",
  "WITH_DISTRIBUTOR",
  "WITH_RETAILER",
  "SOLD",
  "ACTIVATED",
  "EXPIRED_UNSOLD",
  "LOST_DAMAGED",
  "REPLACED",
  "BLOCKED",
] as const;

export function canActivateSticker(status: QrLifecycleState): {
  allowed: boolean;
  reason?: string;
} {
  if (status === "ACTIVATED") {
    return { allowed: false, reason: "Sticker is already activated." };
  }
  if (status === "LOST_DAMAGED" || status === "REPLACED") {
    return { allowed: false, reason: "Sticker has been marked unusable or replaced." };
  }
  if (status === "EXPIRED_UNSOLD") {
    return { allowed: false, reason: "Sticker has expired before sale." };
  }
  if (status === "BLOCKED") {
    return { allowed: false, reason: "Sticker has been blocked." };
  }
  return { allowed: true };
}

export type ResolverResolutionType =
  | "ACTIVE_PROFILE"
  | "UNACTIVATED_QR"
  | "INVALID_QR"
  | "REPLACED_QR"
  | "DISABLED_QR"
  | "LOST_DAMAGED_QR"
  | "LOOKUP_FAILURE";

export interface QrResolverPayload {
  resolution: ResolverResolutionType;
  publicId: string;
  sticker?: QrSticker;
  vehicle?: Partial<Vehicle>;
  emergencyContacts?: EmergencyContact[];
  replacementPublicId?: string;
  errorMessage?: string;
}

export interface IQrResolver {
  resolve(publicId: string): Promise<QrResolverPayload>;
}
