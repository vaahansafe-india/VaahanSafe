/**
 * QR Reservation Domain Entity
 *
 * Captures the authoritative link claiming a physical QR sticker for an online order or replacement.
 * INVARIANT: One physical sticker can only be actively reserved/allocated to one fulfilment.
 */

import { ReservationStatus } from "./reservation-status";

export interface QrReservation {
  id: string;
  qrStickerId: string;
  fulfilmentId: string;
  orderId?: string;
  status: ReservationStatus;
  reservedAt: string;
  allocatedAt?: string;
  releasedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationInput {
  id?: string;
  qrStickerId: string;
  fulfilmentId: string;
  orderId?: string;
  status?: ReservationStatus;
  expiresAt?: string;
  createdAt?: string;
}

export function createQrReservation(input: CreateReservationInput): QrReservation {
  const now = input.createdAt || new Date().toISOString();
  return {
    id: input.id || `qres_${crypto.randomUUID()}`,
    qrStickerId: input.qrStickerId,
    fulfilmentId: input.fulfilmentId,
    orderId: input.orderId,
    status: input.status || "RESERVED",
    reservedAt: now,
    expiresAt: input.expiresAt,
    createdAt: now,
    updatedAt: now,
  };
}
