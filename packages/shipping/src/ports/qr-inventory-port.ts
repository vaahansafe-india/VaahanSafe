/**
 * QR Inventory Port
 *
 * Interface for consuming Phase 08 QR inventory and history records.
 * INVARIANT: Plaintext scratch secrets MUST NEVER be accessible through this port.
 */

export interface EligiblePhysicalQr {
  id: string;
  publicId: string;
  visibleCode: string;
  batchId: string;
}

export interface QrInventoryPort {
  /**
   * Finds the oldest eligible printed unreserved QR sticker in warehouse inventory.
   */
  findEligiblePrintedSticker(): Promise<EligiblePhysicalQr | null>;

  /**
   * Appends an authoritative record to qr_status_history.
   */
  recordStatusHistory(entry: {
    qrId: string;
    fromStatus: string;
    toStatus: string;
    reasonCode: string;
    actorType: "SYSTEM" | "USER" | "ADMIN";
    actorId?: string;
    metadataJson?: string;
  }): Promise<void>;
}
