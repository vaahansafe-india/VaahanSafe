/**
 * QR Reservation Repository Port
 */

import { QrReservation } from "../allocation/reservation";
import { ReservationStatus } from "../allocation/reservation-status";

export interface ReservationRepository {
  findById(id: string): Promise<QrReservation | null>;
  findActiveByFulfilmentId(fulfilmentId: string): Promise<QrReservation | null>;
  findActiveByQrId(qrStickerId: string): Promise<QrReservation | null>;
  createReservation(reservation: QrReservation): Promise<void>;
  updateStatus(
    id: string,
    status: ReservationStatus,
    updates?: { allocatedAt?: string; releasedAt?: string }
  ): Promise<void>;
}
