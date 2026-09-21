/**
 * Replacement Request Domain Entity
 *
 * Captures customer/operator request to migrate vehicle emergency identity to a new sticker.
 */

import { ReplacementReason } from "./replacement-reason";
import { ReplacementStatus } from "./replacement-status";

export interface ReplacementRequest {
  id: string;
  userId: string;
  vehicleId: string;
  oldQrStickerId: string;
  reason: ReplacementReason;
  userNotes?: string;
  status: ReplacementStatus;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  requiresStepUp: boolean;
  approvedBy?: string;
  rejectionReason?: string;
  requestedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReplacementRequestInput {
  id?: string;
  userId: string;
  vehicleId: string;
  oldQrStickerId: string;
  reason: ReplacementReason;
  userNotes?: string;
  status?: ReplacementStatus;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";
  requiresStepUp?: boolean;
  createdAt?: string;
}

export function createReplacementRequest(
  input: CreateReplacementRequestInput
): ReplacementRequest {
  const now = input.createdAt || new Date().toISOString();
  return {
    id: input.id || `rpr_${crypto.randomUUID()}`,
    userId: input.userId,
    vehicleId: input.vehicleId,
    oldQrStickerId: input.oldQrStickerId,
    reason: input.reason,
    userNotes: input.userNotes,
    status: input.status || "REQUESTED",
    riskLevel: input.riskLevel || "LOW",
    requiresStepUp: input.requiresStepUp ?? false,
    requestedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}
