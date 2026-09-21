/**
 * QR Reservation Statuses
 *
 * Tracks the inventory claim state of a physical QR sticker before and during packing.
 * INVARIANT: RESERVED or ALLOCATED physical stickers are NOT activated!
 */

export const RESERVATION_STATUSES = ["RESERVED", "ALLOCATED", "RELEASED", "CANCELLED"] as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export function isValidReservationStatus(status: string): status is ReservationStatus {
  return (RESERVATION_STATUSES as readonly string[]).includes(status);
}
