/**
 * VaahanSafe Safety Capabilities Policy & Commercial Boundary
 *
 * CRITICAL SAFETY INVARIANT:
 * - Commercial subscription expiration does NOT destroy physical QR safety identity.
 * - Active QR stickers MUST always resolve to baseline emergency capabilities.
 * - Centralized policy prevents scattering "if (subscription.active)" across resolver paths.
 * - Product/commercial decisions for lapsed subscriptions remain configurable TBD here.
 */

export interface SafetyCapabilities {
  /** Whether public QR finder emergency profile resolution is permitted */
  allowEmergencyResolution: boolean;
  /** Whether direct emergency contact calling actions are active */
  allowEmergencyCalling: boolean;
  /** Whether medical information may display (subject to owner opt-in) */
  allowMedicalInfoDisplay: boolean;
  /** Indicates whether the vehicle is operating under core-safety continuity (e.g. lapsed plan) */
  isCoreSafetyOnly: boolean;
}

export interface SafetyCapabilitiesInput {
  qrStatus: string;
  subscriptionStatus?: string | null;
}

/**
 * Authoritatively computes safety capabilities for a QR sticker and subscription state.
 */
export function getSafetyCapabilities(input: SafetyCapabilitiesInput): SafetyCapabilities {
  const isQrActive = input.qrStatus === "ACTIVATED" || input.qrStatus === "ACTIVE";

  // If the QR is not in an activated state (e.g. PRINTED, BLOCKED, REPLACED), safety resolution is blocked
  if (!isQrActive) {
    return {
      allowEmergencyResolution: false,
      allowEmergencyCalling: false,
      allowMedicalInfoDisplay: false,
      isCoreSafetyOnly: false,
    };
  }

  const isSubActive = input.subscriptionStatus === "ACTIVE";

  // LIFE-SAFETY INVARIANT:
  // Even if subscription is EXPIRED, PAST_DUE, or absent, the physical QR continues
  // to resolve baseline life-safety emergency context and calling!
  return {
    allowEmergencyResolution: true,
    allowEmergencyCalling: true,
    allowMedicalInfoDisplay: true,
    isCoreSafetyOnly: !isSubActive,
  };
}
