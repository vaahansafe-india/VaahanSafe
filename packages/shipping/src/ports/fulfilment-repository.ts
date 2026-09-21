/**
 * Fulfilment Repository Port
 */

import { Fulfilment } from "../fulfilment/fulfilment";
import { FulfilmentStatus } from "../fulfilment/fulfilment-status";

export interface FulfilmentRepository {
  findById(id: string): Promise<Fulfilment | null>;
  findByOrderId(orderId: string): Promise<Fulfilment | null>;
  findByUserId(userId: string, limit?: number): Promise<Fulfilment[]>;
  save(fulfilment: Fulfilment): Promise<void>;
  updateStatus(
    id: string,
    status: FulfilmentStatus,
    updates?: {
      processingAt?: string;
      packedAt?: string;
      completedAt?: string;
      cancelledAt?: string;
      exceptionCode?: string;
    }
  ): Promise<void>;
}
