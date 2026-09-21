/**
 * QR Allocation Service
 *
 * Finalizes the reservation when packing is confirmed, binding the unit to the order.
 */

import { ReservationRepository } from "../ports/reservation-repository";
import { QrInventoryPort } from "../ports/qr-inventory-port";
import { ReservationNotFoundError, ShippingDomainError } from "../errors/shipping-errors";

export async function allocateReservedQr(
  reservationId: string,
  deps: { reservationRepo: ReservationRepository; inventoryPort: QrInventoryPort }
): Promise<void> {
  const res = await deps.reservationRepo.findById(reservationId);
  if (!res) {
    throw new ReservationNotFoundError(reservationId);
  }

  if (res.status === "ALLOCATED") {
    return; // idempotent
  }

  if (res.status !== "RESERVED") {
    throw new ShippingDomainError(
      "ALLOCATION_NOT_ALLOWED",
      `Cannot allocate QR reservation in "${res.status}" status`
    );
  }

  const now = new Date().toISOString();
  await deps.reservationRepo.updateStatus(reservationId, "ALLOCATED", { allocatedAt: now });

  await deps.inventoryPort.recordStatusHistory({
    qrId: res.qrStickerId,
    fromStatus: "PRINTED",
    toStatus: "PRINTED",
    reasonCode: "ONLINE_ORDER_ALLOCATED",
    actorType: "SYSTEM",
    metadataJson: JSON.stringify({ reservationId, fulfilmentId: res.fulfilmentId }),
  });
}
