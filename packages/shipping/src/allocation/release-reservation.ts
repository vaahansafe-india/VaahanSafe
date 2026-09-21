/**
 * QR Reservation Release Service
 *
 * Releases a reserved sticker back to eligible warehouse inventory if an order or fulfilment is cancelled.
 * INVARIANT: Units already irreversibly allocated or shipped cannot be silently released.
 */

import { ReservationRepository } from "../ports/reservation-repository";
import { QrInventoryPort } from "../ports/qr-inventory-port";
import { ReservationNotFoundError, ShippingDomainError } from "../errors/shipping-errors";

export async function releaseReservation(
  reservationId: string,
  reason: string,
  deps: { reservationRepo: ReservationRepository; inventoryPort: QrInventoryPort }
): Promise<void> {
  const res = await deps.reservationRepo.findById(reservationId);
  if (!res) {
    throw new ReservationNotFoundError(reservationId);
  }

  if (res.status === "RELEASED" || res.status === "CANCELLED") {
    return; // idempotent
  }

  if (res.status === "ALLOCATED") {
    throw new ShippingDomainError(
      "RESERVATION_RELEASE_NOT_ALLOWED",
      "Cannot release an already allocated sticker without formal order return/cancellation review"
    );
  }

  const now = new Date().toISOString();
  await deps.reservationRepo.updateStatus(reservationId, "RELEASED", { releasedAt: now });

  await deps.inventoryPort.recordStatusHistory({
    qrId: res.qrStickerId,
    fromStatus: "PRINTED",
    toStatus: "PRINTED",
    reasonCode: "ONLINE_ORDER_RESERVATION_RELEASED",
    actorType: "SYSTEM",
    metadataJson: JSON.stringify({ reservationId, fulfilmentId: res.fulfilmentId, reason }),
  });
}
