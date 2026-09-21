/**
 * Physical QR Reservation Service
 *
 * Reserves a physical QR sticker from Phase 08 warehouse inventory for an online fulfilment.
 *
 * INVARIANTS:
 * 1. Idempotent: Retrying for the same fulfilment reuses the existing active reservation.
 * 2. Concurrency: Double reservation is prevented at database engine level.
 * 3. Scratch plaintext is never accessed or projected.
 * 4. Reservation != Activation.
 */

import { QrReservation, createQrReservation } from "./reservation";
import { ReservationRepository } from "../ports/reservation-repository";
import { QrInventoryPort } from "../ports/qr-inventory-port";
import { NoEligibleInventoryError, QrReservationConflictError } from "../errors/shipping-errors";

export interface ReservePhysicalQrInput {
  fulfilmentId: string;
  orderId?: string;
  expiresInMinutes?: number;
}

export interface ReservePhysicalQrDependencies {
  reservationRepo: ReservationRepository;
  inventoryPort: QrInventoryPort;
}

export async function reservePhysicalQr(
  input: ReservePhysicalQrInput,
  deps: ReservePhysicalQrDependencies
): Promise<QrReservation> {
  // 1. Idempotency check: if this fulfilment already holds an active reservation, reuse it
  const existing = await deps.reservationRepo.findActiveByFulfilmentId(input.fulfilmentId);
  if (existing) {
    return existing;
  }

  // 2. Select eligible printed unassigned sticker from warehouse inventory
  const eligibleSticker = await deps.inventoryPort.findEligiblePrintedSticker();
  if (!eligibleSticker) {
    throw new NoEligibleInventoryError();
  }

  // 3. Concurrency check: verify target sticker is not already reserved by a concurrent worker
  const activeStickerRes = await deps.reservationRepo.findActiveByQrId(eligibleSticker.id);
  if (activeStickerRes) {
    throw new QrReservationConflictError(eligibleSticker.id);
  }

  // 4. Create reservation
  const expiresAt = input.expiresInMinutes
    ? new Date(Date.now() + input.expiresInMinutes * 60 * 1000).toISOString()
    : undefined;

  const reservation = createQrReservation({
    qrStickerId: eligibleSticker.id,
    fulfilmentId: input.fulfilmentId,
    orderId: input.orderId,
    status: "RESERVED",
    expiresAt,
  });

  await deps.reservationRepo.createReservation(reservation);

  // 5. Append audit entry to qr_status_history
  await deps.inventoryPort.recordStatusHistory({
    qrId: eligibleSticker.id,
    fromStatus: "PRINTED",
    toStatus: "PRINTED",
    reasonCode: "ONLINE_ORDER_RESERVED",
    actorType: "SYSTEM",
    metadataJson: JSON.stringify({
      fulfilmentId: input.fulfilmentId,
      orderId: input.orderId,
      reservationId: reservation.id,
    }),
  });

  return reservation;
}
