/**
 * Shipment Repository Port
 */

import { Shipment } from "../shipments/shipment";
import { ShipmentStatus } from "../shipments/shipment-status";

export interface ShipmentRepository {
  findById(id: string): Promise<Shipment | null>;
  findByFulfilmentId(fulfilmentId: string): Promise<Shipment | null>;
  findByTrackingReference(trackingReference: string): Promise<Shipment | null>;
  findByUserId(userId: string, limit?: number): Promise<Shipment[]>;
  save(shipment: Shipment): Promise<void>;
  updateStatus(
    id: string,
    status: ShipmentStatus,
    updates?: {
      trackingReference?: string;
      shippedAt?: string;
      deliveredAt?: string;
    }
  ): Promise<void>;
}
