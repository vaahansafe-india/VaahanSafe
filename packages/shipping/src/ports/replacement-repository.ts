/**
 * Replacement Request Repository Port
 */

import { ReplacementRequest } from "../replacements/replacement-request";
import { ReplacementStatus } from "../replacements/replacement-status";

export interface ReplacementRepository {
  findById(id: string): Promise<ReplacementRequest | null>;
  findActiveByOldQrId(oldQrStickerId: string): Promise<ReplacementRequest | null>;
  findByUserId(userId: string, limit?: number): Promise<ReplacementRequest[]>;
  save(request: ReplacementRequest): Promise<void>;
  updateStatus(
    id: string,
    status: ReplacementStatus,
    updates?: {
      approvedBy?: string;
      approvedAt?: string;
      rejectionReason?: string;
      rejectedAt?: string;
      completedAt?: string;
    }
  ): Promise<void>;
}
