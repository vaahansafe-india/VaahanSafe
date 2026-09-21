/**
 * Canonical QR Replacement Request Statuses
 */

export const REPLACEMENT_STATUSES = [
  "REQUESTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "QR_ALLOCATED",
  "MIGRATED",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type ReplacementStatus = (typeof REPLACEMENT_STATUSES)[number];

export function isValidReplacementStatus(status: string): status is ReplacementStatus {
  return (REPLACEMENT_STATUSES as readonly string[]).includes(status);
}

export function isTerminalReplacementStatus(status: ReplacementStatus): boolean {
  return ["REJECTED", "COMPLETED", "CANCELLED"].includes(status);
}

const ALLOWED_REPLACEMENT_TRANSITIONS: Record<ReplacementStatus, readonly ReplacementStatus[]> = {
  REQUESTED: ["UNDER_REVIEW", "APPROVED", "REJECTED", "CANCELLED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["QR_ALLOCATED", "CANCELLED"],
  QR_ALLOCATED: ["MIGRATED", "CANCELLED"],
  MIGRATED: ["SHIPPED", "COMPLETED"],
  SHIPPED: ["COMPLETED"],
  REJECTED: [], // Terminal
  COMPLETED: [], // Terminal
  CANCELLED: [], // Terminal
};

export function evaluateReplacementTransition(
  fromStatus: ReplacementStatus,
  toStatus: ReplacementStatus
): { allowed: boolean; reason?: string } {
  if (fromStatus === toStatus) {
    return { allowed: true };
  }

  const allowedTargets = ALLOWED_REPLACEMENT_TRANSITIONS[fromStatus];
  if (!allowedTargets || !allowedTargets.includes(toStatus)) {
    return {
      allowed: false,
      reason: `Illegal replacement status transition from "${fromStatus}" to "${toStatus}"`,
    };
  }

  return { allowed: true };
}
