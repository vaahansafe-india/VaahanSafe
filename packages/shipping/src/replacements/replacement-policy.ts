/**
 * QR Replacement Policy & Eligibility Rules
 *
 * Enforces ownership verification, fraud controls, and step-up boundaries.
 * INVARIANT: Never accept oldQrId from caller without validating vehicle ownership.
 */

import { ReplacementReason } from "./replacement-reason";
import { ReplacementNotAllowedError, ReplacementRequiresStepUpError } from "../errors/shipping-errors";

export interface ReplacementEligibilityContext {
  userId: string;
  vehicleOwnerUserId: string;
  vehicleStatus: string;
  oldQrStatus: string;
  activeAssignmentQrId?: string;
  hasOpenReplacementRequest: boolean;
  isAccountRecentlyRecovered?: boolean;
  hoursSinceLastSecurityChange?: number;
  totalPriorReplacements?: number;
}

export interface ReplacementEvaluationResult {
  isEligible: boolean;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  requiresStepUp: boolean;
  autoApprove: boolean;
}

export function evaluateReplacementEligibility(
  context: ReplacementEligibilityContext,
  reason: ReplacementReason
): ReplacementEvaluationResult {
  // 1. Ownership verification: caller must own the vehicle
  if (context.userId !== context.vehicleOwnerUserId) {
    throw new ReplacementNotAllowedError("User does not own this vehicle (IDOR check failed)");
  }

  // 2. Vehicle active check
  if (context.vehicleStatus !== "ACTIVE") {
    throw new ReplacementNotAllowedError("Cannot replace QR for inactive or deleted vehicle");
  }

  // 3. Old QR status check: must be ACTIVATED
  if (context.oldQrStatus !== "ACTIVATED") {
    throw new ReplacementNotAllowedError(
      `Only actively assigned and activated QR stickers can be replaced (current status: "${context.oldQrStatus}")`
    );
  }

  // 4. Multiple open requests check
  if (context.hasOpenReplacementRequest) {
    throw new ReplacementNotAllowedError("An active replacement request is already in progress for this QR sticker");
  }

  // 5. Fraud & risk evaluation
  let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  let requiresStepUp = false;

  if (
    context.isAccountRecentlyRecovered ||
    (context.hoursSinceLastSecurityChange !== undefined && context.hoursSinceLastSecurityChange < 48)
  ) {
    riskLevel = "HIGH";
    requiresStepUp = true;
  } else if ((context.totalPriorReplacements || 0) >= 2) {
    riskLevel = "MEDIUM";
    requiresStepUp = true;
  }

  // 6. Approval rule: Low-risk print defect or damaged stickers can be auto-approved
  const autoApprove = riskLevel === "LOW" && (reason === "PRINT_DEFECT" || reason === "DELIVERY_DAMAGE");

  return {
    isEligible: true,
    riskLevel,
    requiresStepUp,
    autoApprove,
  };
}
