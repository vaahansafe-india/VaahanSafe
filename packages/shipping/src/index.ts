/**
 * @vaahansafe/shipping
 *
 * Physical QR Allocation, Fulfilment State Machine, Shipment Tracking,
 * and Controlled Replacement Migration.
 *
 * INVARIANTS:
 * 1. Two acquisition channels, ONE inventory infrastructure.
 * 2. Order != Payment != Fulfilment != Shipment != QR Activation != Replacement.
 * 3. Physical stickers originate strictly from Phase 08 qr_stickers inventory.
 * 4. Scratch plaintext is never accessed during fulfilment.
 * 5. Replaced QRs are never deleted; historical assignments are preserved.
 */

export * from "./fulfilment";
export * from "./allocation";
export * from "./shipments";
export * from "./replacements";
export * from "./ports";
export * from "./errors";
