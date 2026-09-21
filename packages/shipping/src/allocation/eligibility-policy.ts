/**
 * Central Physical QR Inventory Eligibility Policy
 *
 * Enforces strict criteria on which pre-generated Phase 08 stickers can satisfy
 * online orders and replacements.
 *
 * INVARIANTS:
 * 1. Two acquisition channels, ONE inventory infrastructure.
 * 2. Units in retail/distributor channels or terminal states cannot be allocated online.
 * 3. Scratch plaintext is strictly omitted from all fulfilment inventory queries.
 */

export interface PhysicalQrInventoryCandidate {
  id: string;
  publicId: string;
  visibleCode: string;
  batchId: string;
  status: string;
  currentDistributorId?: string | null;
  currentRetailerId?: string | null;
  hasActiveReservation: boolean;
  hasActiveAssignment: boolean;
}

export interface EligibilityEvaluation {
  isEligible: boolean;
  reason?: string;
}

export function evaluateQrInventoryEligibility(
  sticker: PhysicalQrInventoryCandidate
): EligibilityEvaluation {
  // 1. Status check: must be in PRINTED status
  if (sticker.status !== "PRINTED") {
    return {
      isEligible: false,
      reason: `Sticker status "${sticker.status}" is not eligible for online allocation (must be PRINTED)`,
    };
  }

  // 2. Channel check: must not be assigned to distributor or retail inventory
  if (sticker.currentDistributorId || sticker.currentRetailerId) {
    return {
      isEligible: false,
      reason: "Sticker is currently assigned to offline distribution/retail channels",
    };
  }

  // 3. Reservation check: must not have an existing active reservation
  if (sticker.hasActiveReservation) {
    return {
      isEligible: false,
      reason: "Sticker currently has an active reservation for another fulfilment",
    };
  }

  // 4. Assignment check: must not be actively paired with any vehicle
  if (sticker.hasActiveAssignment) {
    return {
      isEligible: false,
      reason: "Sticker is actively assigned to a vehicle",
    };
  }

  return { isEligible: true };
}
