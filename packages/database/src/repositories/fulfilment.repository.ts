/**
 * VaahanSafe D1 Fulfilment, Reservation, Shipment & Replacement Repositories
 *
 * Implements FulfilmentRepository, ReservationRepository, ShipmentRepository,
 * ReplacementRepository, StickerReplacementRepository, and QrInventoryPort
 * against Cloudflare D1 with strict parameterization and SQLite concurrency safety.
 *
 * INVARIANTS:
 * - Scratch plaintext secrets are NEVER exposed or retrieved.
 * - Single active reservation per QR sticker enforced via D1 partial unique index.
 * - Single active replacement per QR sticker enforced via D1 partial unique index.
 * - Old QR is never deleted during replacement; old-to-new links are immutable.
 */

import {
  Fulfilment,
  FulfilmentRepository,
  FulfilmentStatus,
  FulfilmentType,
  ShippingAddressSnapshot,
  QrReservation,
  ReservationRepository,
  ReservationStatus,
  Shipment,
  ShipmentRepository,
  ShipmentStatus,
  ReplacementRequest,
  ReplacementRepository,
  ReplacementStatus,
  ReplacementReason,
  StickerReplacementLink,
  StickerReplacementRepository,
  QrInventoryPort,
  EligiblePhysicalQr,
} from "@vaahansafe/shipping";
import type { DatabaseClient } from "../client/d1";

// ==============================================================================
// 1. D1FulfilmentRepository
// ==============================================================================

interface DbFulfilmentRow {
  id: string;
  order_id: string;
  user_id: string;
  type: string;
  status: string;
  shipping_address_snapshot_json: string;
  exception_code: string | null;
  processing_at: string | null;
  packed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export class D1FulfilmentRepository implements FulfilmentRepository {
  constructor(private db: DatabaseClient) {}

  private mapRow(row: DbFulfilmentRow): Fulfilment {
    let address: ShippingAddressSnapshot;
    try {
      address = JSON.parse(row.shipping_address_snapshot_json);
    } catch {
      address = {
        fullName: "Unknown",
        phone: "",
        line1: "Unknown",
        city: "",
        state: "",
        postalCode: "",
        country: "IN",
      };
    }

    return {
      id: row.id,
      orderId: row.order_id,
      userId: row.user_id,
      type: row.type as FulfilmentType,
      status: row.status as FulfilmentStatus,
      shippingAddressSnapshot: address,
      exceptionCode: row.exception_code ?? undefined,
      processingAt: row.processing_at ?? undefined,
      packedAt: row.packed_at ?? undefined,
      completedAt: row.completed_at ?? undefined,
      cancelledAt: row.cancelled_at ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findById(id: string): Promise<Fulfilment | null> {
    const row = await this.db.queryFirst<DbFulfilmentRow>(
      `SELECT * FROM fulfilments WHERE id = ?`,
      [id]
    );
    return row ? this.mapRow(row) : null;
  }

  async findByOrderId(orderId: string): Promise<Fulfilment | null> {
    const row = await this.db.queryFirst<DbFulfilmentRow>(
      `SELECT * FROM fulfilments WHERE order_id = ?`,
      [orderId]
    );
    return row ? this.mapRow(row) : null;
  }

  async findByUserId(userId: string, limit = 50): Promise<Fulfilment[]> {
    const rows = await this.db.query<DbFulfilmentRow>(
      `SELECT * FROM fulfilments WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [userId, limit]
    );
    return rows.map((r) => this.mapRow(r));
  }

  async save(fulfilment: Fulfilment): Promise<void> {
    const now = new Date().toISOString();
    const addressJson = JSON.stringify(fulfilment.shippingAddressSnapshot);

    await this.db.execute(
      `INSERT INTO fulfilments (
        id, order_id, user_id, type, status,
        shipping_address_snapshot_json, exception_code,
        processing_at, packed_at, completed_at, cancelled_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        shipping_address_snapshot_json = excluded.shipping_address_snapshot_json,
        exception_code = excluded.exception_code,
        processing_at = excluded.processing_at,
        packed_at = excluded.packed_at,
        completed_at = excluded.completed_at,
        cancelled_at = excluded.cancelled_at,
        updated_at = excluded.updated_at`,
      [
        fulfilment.id,
        fulfilment.orderId,
        fulfilment.userId,
        fulfilment.type,
        fulfilment.status,
        addressJson,
        fulfilment.exceptionCode ?? null,
        fulfilment.processingAt ?? null,
        fulfilment.packedAt ?? null,
        fulfilment.completedAt ?? null,
        fulfilment.cancelledAt ?? null,
        fulfilment.createdAt || now,
        now,
      ]
    );
  }

  async updateStatus(
    id: string,
    status: FulfilmentStatus,
    updates?: {
      processingAt?: string;
      packedAt?: string;
      completedAt?: string;
      cancelledAt?: string;
      exceptionCode?: string;
    }
  ): Promise<void> {
    const now = new Date().toISOString();
    await this.db.execute(
      `UPDATE fulfilments SET
        status = ?,
        processing_at = COALESCE(?, processing_at),
        packed_at = COALESCE(?, packed_at),
        completed_at = COALESCE(?, completed_at),
        cancelled_at = COALESCE(?, cancelled_at),
        exception_code = COALESCE(?, exception_code),
        updated_at = ?
      WHERE id = ?`,
      [
        status,
        updates?.processingAt ?? null,
        updates?.packedAt ?? null,
        updates?.completedAt ?? null,
        updates?.cancelledAt ?? null,
        updates?.exceptionCode ?? null,
        now,
        id,
      ]
    );
  }
}

// ==============================================================================
// 2. D1ReservationRepository
// ==============================================================================

interface DbReservationRow {
  id: string;
  qr_sticker_id: string;
  fulfilment_id: string;
  order_id: string | null;
  status: string;
  reserved_at: string;
  allocated_at: string | null;
  released_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export class D1ReservationRepository implements ReservationRepository {
  constructor(private db: DatabaseClient) {}

  private mapRow(row: DbReservationRow): QrReservation {
    return {
      id: row.id,
      qrStickerId: row.qr_sticker_id,
      fulfilmentId: row.fulfilment_id,
      orderId: row.order_id ?? undefined,
      status: row.status as ReservationStatus,
      reservedAt: row.reserved_at,
      allocatedAt: row.allocated_at ?? undefined,
      releasedAt: row.released_at ?? undefined,
      expiresAt: row.expires_at ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findById(id: string): Promise<QrReservation | null> {
    const row = await this.db.queryFirst<DbReservationRow>(
      `SELECT * FROM qr_reservations WHERE id = ?`,
      [id]
    );
    return row ? this.mapRow(row) : null;
  }

  async findActiveByFulfilmentId(fulfilmentId: string): Promise<QrReservation | null> {
    const row = await this.db.queryFirst<DbReservationRow>(
      `SELECT * FROM qr_reservations 
       WHERE fulfilment_id = ? AND status IN ('RESERVED', 'ALLOCATED')
       LIMIT 1`,
      [fulfilmentId]
    );
    return row ? this.mapRow(row) : null;
  }

  async findActiveByQrId(qrStickerId: string): Promise<QrReservation | null> {
    const row = await this.db.queryFirst<DbReservationRow>(
      `SELECT * FROM qr_reservations 
       WHERE qr_sticker_id = ? AND status IN ('RESERVED', 'ALLOCATED')
       LIMIT 1`,
      [qrStickerId]
    );
    return row ? this.mapRow(row) : null;
  }

  async createReservation(reservation: QrReservation): Promise<void> {
    const now = new Date().toISOString();
    await this.db.execute(
      `INSERT INTO qr_reservations (
        id, qr_sticker_id, fulfilment_id, order_id,
        status, reserved_at, allocated_at, released_at, expires_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reservation.id,
        reservation.qrStickerId,
        reservation.fulfilmentId,
        reservation.orderId ?? null,
        reservation.status,
        reservation.reservedAt || now,
        reservation.allocatedAt ?? null,
        reservation.releasedAt ?? null,
        reservation.expiresAt ?? null,
        reservation.createdAt || now,
        now,
      ]
    );
  }

  async updateStatus(
    id: string,
    status: ReservationStatus,
    updates?: { allocatedAt?: string; releasedAt?: string }
  ): Promise<void> {
    const now = new Date().toISOString();
    await this.db.execute(
      `UPDATE qr_reservations SET
        status = ?,
        allocated_at = COALESCE(?, allocated_at),
        released_at = COALESCE(?, released_at),
        updated_at = ?
      WHERE id = ?`,
      [status, updates?.allocatedAt ?? null, updates?.releasedAt ?? null, now, id]
    );
  }
}

// ==============================================================================
// 3. D1ShipmentRepository
// ==============================================================================

interface DbShipmentRow {
  id: string;
  fulfilment_id: string;
  order_id: string;
  user_id: string;
  provider: string;
  provider_shipment_id: string | null;
  tracking_reference: string | null;
  status: string;
  shipping_address_snapshot_json: string;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export class D1ShipmentRepository implements ShipmentRepository {
  constructor(private db: DatabaseClient) {}

  private mapRow(row: DbShipmentRow): Shipment {
    let address: ShippingAddressSnapshot;
    try {
      address = JSON.parse(row.shipping_address_snapshot_json);
    } catch {
      address = {
        fullName: "Unknown",
        phone: "",
        line1: "Unknown",
        city: "",
        state: "",
        postalCode: "",
        country: "IN",
      };
    }

    return {
      id: row.id,
      fulfilmentId: row.fulfilment_id,
      orderId: row.order_id,
      userId: row.user_id,
      provider: row.provider,
      providerShipmentId: row.provider_shipment_id ?? undefined,
      trackingReference: row.tracking_reference ?? undefined,
      status: row.status as ShipmentStatus,
      shippingAddressSnapshot: address,
      shippedAt: row.shipped_at ?? undefined,
      deliveredAt: row.delivered_at ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findById(id: string): Promise<Shipment | null> {
    const row = await this.db.queryFirst<DbShipmentRow>(
      `SELECT * FROM shipments WHERE id = ?`,
      [id]
    );
    return row ? this.mapRow(row) : null;
  }

  async findByFulfilmentId(fulfilmentId: string): Promise<Shipment | null> {
    const row = await this.db.queryFirst<DbShipmentRow>(
      `SELECT * FROM shipments WHERE fulfilment_id = ?`,
      [fulfilmentId]
    );
    return row ? this.mapRow(row) : null;
  }

  async findByTrackingReference(trackingReference: string): Promise<Shipment | null> {
    const row = await this.db.queryFirst<DbShipmentRow>(
      `SELECT * FROM shipments WHERE tracking_reference = ?`,
      [trackingReference]
    );
    return row ? this.mapRow(row) : null;
  }

  async findByUserId(userId: string, limit = 50): Promise<Shipment[]> {
    const rows = await this.db.query<DbShipmentRow>(
      `SELECT * FROM shipments WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [userId, limit]
    );
    return rows.map((r) => this.mapRow(r));
  }

  async save(shipment: Shipment): Promise<void> {
    const now = new Date().toISOString();
    const addressJson = JSON.stringify(shipment.shippingAddressSnapshot);

    await this.db.execute(
      `INSERT INTO shipments (
        id, fulfilment_id, order_id, user_id, provider,
        provider_shipment_id, tracking_reference, status,
        shipping_address_snapshot_json, shipped_at, delivered_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        provider = excluded.provider,
        provider_shipment_id = excluded.provider_shipment_id,
        tracking_reference = excluded.tracking_reference,
        status = excluded.status,
        shipping_address_snapshot_json = excluded.shipping_address_snapshot_json,
        shipped_at = excluded.shipped_at,
        delivered_at = excluded.delivered_at,
        updated_at = excluded.updated_at`,
      [
        shipment.id,
        shipment.fulfilmentId,
        shipment.orderId,
        shipment.userId,
        shipment.provider,
        shipment.providerShipmentId ?? null,
        shipment.trackingReference ?? null,
        shipment.status,
        addressJson,
        shipment.shippedAt ?? null,
        shipment.deliveredAt ?? null,
        shipment.createdAt || now,
        now,
      ]
    );
  }

  async updateStatus(
    id: string,
    status: ShipmentStatus,
    updates?: {
      trackingReference?: string;
      shippedAt?: string;
      deliveredAt?: string;
    }
  ): Promise<void> {
    const now = new Date().toISOString();
    await this.db.execute(
      `UPDATE shipments SET
        status = ?,
        tracking_reference = COALESCE(?, tracking_reference),
        shipped_at = COALESCE(?, shipped_at),
        delivered_at = COALESCE(?, delivered_at),
        updated_at = ?
      WHERE id = ?`,
      [
        status,
        updates?.trackingReference ?? null,
        updates?.shippedAt ?? null,
        updates?.deliveredAt ?? null,
        now,
        id,
      ]
    );
  }
}

// ==============================================================================
// 4. D1ReplacementRepository
// ==============================================================================

interface DbReplacementRequestRow {
  id: string;
  user_id: string;
  vehicle_id: string;
  old_qr_sticker_id: string;
  reason: string;
  user_notes: string | null;
  status: string;
  risk_level: string;
  requires_step_up: number;
  approved_by: string | null;
  rejection_reason: string | null;
  requested_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export class D1ReplacementRepository implements ReplacementRepository {
  constructor(private db: DatabaseClient) {}

  private mapRow(row: DbReplacementRequestRow): ReplacementRequest {
    return {
      id: row.id,
      userId: row.user_id,
      vehicleId: row.vehicle_id,
      oldQrStickerId: row.old_qr_sticker_id,
      reason: row.reason as ReplacementReason,
      userNotes: row.user_notes ?? undefined,
      status: row.status as ReplacementStatus,
      riskLevel: row.risk_level as "LOW" | "MEDIUM" | "HIGH",
      requiresStepUp: row.requires_step_up === 1,
      approvedBy: row.approved_by ?? undefined,
      rejectionReason: row.rejection_reason ?? undefined,
      requestedAt: row.requested_at,
      approvedAt: row.approved_at ?? undefined,
      rejectedAt: row.rejected_at ?? undefined,
      completedAt: row.completed_at ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findById(id: string): Promise<ReplacementRequest | null> {
    const row = await this.db.queryFirst<DbReplacementRequestRow>(
      `SELECT * FROM replacement_requests WHERE id = ?`,
      [id]
    );
    return row ? this.mapRow(row) : null;
  }

  async findActiveByOldQrId(oldQrStickerId: string): Promise<ReplacementRequest | null> {
    const row = await this.db.queryFirst<DbReplacementRequestRow>(
      `SELECT * FROM replacement_requests 
       WHERE old_qr_sticker_id = ? AND status NOT IN ('REJECTED', 'COMPLETED', 'CANCELLED')
       LIMIT 1`,
      [oldQrStickerId]
    );
    return row ? this.mapRow(row) : null;
  }

  async findByUserId(userId: string, limit = 50): Promise<ReplacementRequest[]> {
    const rows = await this.db.query<DbReplacementRequestRow>(
      `SELECT * FROM replacement_requests WHERE user_id = ? ORDER BY requested_at DESC LIMIT ?`,
      [userId, limit]
    );
    return rows.map((r) => this.mapRow(r));
  }

  async save(request: ReplacementRequest): Promise<void> {
    const now = new Date().toISOString();
    await this.db.execute(
      `INSERT INTO replacement_requests (
        id, user_id, vehicle_id, old_qr_sticker_id, reason, user_notes,
        status, risk_level, requires_step_up, approved_by, rejection_reason,
        requested_at, approved_at, rejected_at, completed_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        risk_level = excluded.risk_level,
        requires_step_up = excluded.requires_step_up,
        approved_by = excluded.approved_by,
        rejection_reason = excluded.rejection_reason,
        approved_at = excluded.approved_at,
        rejected_at = excluded.rejected_at,
        completed_at = excluded.completed_at,
        updated_at = excluded.updated_at`,
      [
        request.id,
        request.userId,
        request.vehicleId,
        request.oldQrStickerId,
        request.reason,
        request.userNotes ?? null,
        request.status,
        request.riskLevel,
        request.requiresStepUp ? 1 : 0,
        request.approvedBy ?? null,
        request.rejectionReason ?? null,
        request.requestedAt || now,
        request.approvedAt ?? null,
        request.rejectedAt ?? null,
        request.completedAt ?? null,
        request.createdAt || now,
        now,
      ]
    );
  }

  async updateStatus(
    id: string,
    status: ReplacementStatus,
    updates?: {
      approvedBy?: string;
      approvedAt?: string;
      rejectionReason?: string;
      rejectedAt?: string;
      completedAt?: string;
    }
  ): Promise<void> {
    const now = new Date().toISOString();
    await this.db.execute(
      `UPDATE replacement_requests SET
        status = ?,
        approved_by = COALESCE(?, approved_by),
        approved_at = COALESCE(?, approved_at),
        rejection_reason = COALESCE(?, rejection_reason),
        rejected_at = COALESCE(?, rejected_at),
        completed_at = COALESCE(?, completed_at),
        updated_at = ?
      WHERE id = ?`,
      [
        status,
        updates?.approvedBy ?? null,
        updates?.approvedAt ?? null,
        updates?.rejectionReason ?? null,
        updates?.rejectedAt ?? null,
        updates?.completedAt ?? null,
        now,
        id,
      ]
    );
  }
}

// ==============================================================================
// 5. D1StickerReplacementRepository
// ==============================================================================

interface DbStickerReplacementRow {
  id: string;
  replacement_request_id: string;
  old_qr_sticker_id: string;
  new_qr_sticker_id: string;
  vehicle_id: string;
  reason: string;
  migrated_at: string;
  created_at: string;
}

export class D1StickerReplacementRepository implements StickerReplacementRepository {
  constructor(private db: DatabaseClient) {}

  private mapRow(row: DbStickerReplacementRow): StickerReplacementLink {
    return {
      id: row.id,
      replacementRequestId: row.replacement_request_id,
      oldQrStickerId: row.old_qr_sticker_id,
      newQrStickerId: row.new_qr_sticker_id,
      vehicleId: row.vehicle_id,
      reason: row.reason,
      migratedAt: row.migrated_at,
      createdAt: row.created_at,
    };
  }

  async findById(id: string): Promise<StickerReplacementLink | null> {
    const row = await this.db.queryFirst<DbStickerReplacementRow>(
      `SELECT * FROM sticker_replacements WHERE id = ?`,
      [id]
    );
    return row ? this.mapRow(row) : null;
  }

  async findByRequestId(requestId: string): Promise<StickerReplacementLink | null> {
    const row = await this.db.queryFirst<DbStickerReplacementRow>(
      `SELECT * FROM sticker_replacements WHERE replacement_request_id = ?`,
      [requestId]
    );
    return row ? this.mapRow(row) : null;
  }

  async findByOldQrId(oldQrStickerId: string): Promise<StickerReplacementLink | null> {
    const row = await this.db.queryFirst<DbStickerReplacementRow>(
      `SELECT * FROM sticker_replacements WHERE old_qr_sticker_id = ?`,
      [oldQrStickerId]
    );
    return row ? this.mapRow(row) : null;
  }

  async findByNewQrId(newQrStickerId: string): Promise<StickerReplacementLink | null> {
    const row = await this.db.queryFirst<DbStickerReplacementRow>(
      `SELECT * FROM sticker_replacements WHERE new_qr_sticker_id = ?`,
      [newQrStickerId]
    );
    return row ? this.mapRow(row) : null;
  }

  async save(link: StickerReplacementLink): Promise<void> {
    const now = new Date().toISOString();
    await this.db.execute(
      `INSERT INTO sticker_replacements (
        id, replacement_request_id, old_qr_sticker_id,
        new_qr_sticker_id, vehicle_id, reason, migrated_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        link.id,
        link.replacementRequestId,
        link.oldQrStickerId,
        link.newQrStickerId,
        link.vehicleId,
        link.reason,
        link.migratedAt || now,
        link.createdAt || now,
      ]
    );
  }
}

// ==============================================================================
// 6. D1QrInventoryAdapter (QrInventoryPort)
// ==============================================================================

interface DbEligibleQrRow {
  id: string;
  public_id: string;
  visible_code: string;
  batch_id: string;
}

export class D1QrInventoryAdapter implements QrInventoryPort {
  constructor(private db: DatabaseClient) {}

  /**
   * Finds the oldest eligible printed unreserved QR sticker in warehouse inventory.
   * INVARIANT: No scratch secret is returned or accessed!
   */
  async findEligiblePrintedSticker(): Promise<EligiblePhysicalQr | null> {
    const row = await this.db.queryFirst<DbEligibleQrRow>(
      `SELECT s.id, s.public_id, s.visible_code, s.batch_id
       FROM qr_stickers s
       WHERE s.status = 'PRINTED'
         AND s.current_distributor_id IS NULL
         AND s.current_retailer_id IS NULL
         AND NOT EXISTS (
           SELECT 1 FROM qr_reservations r 
           WHERE r.qr_sticker_id = s.id 
             AND r.status IN ('RESERVED', 'ALLOCATED')
         )
         AND NOT EXISTS (
           SELECT 1 FROM qr_assignments a 
           WHERE a.qr_id = s.id 
             AND a.ended_at IS NULL
         )
       ORDER BY s.created_at ASC, s.id ASC
       LIMIT 1`
    );

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      publicId: row.public_id,
      visibleCode: row.visible_code,
      batchId: row.batch_id,
    };
  }

  /**
   * Appends an authoritative record to qr_status_history.
   */
  async recordStatusHistory(entry: {
    qrId: string;
    fromStatus: string;
    toStatus: string;
    reasonCode: string;
    actorType: "SYSTEM" | "USER" | "ADMIN";
    actorId?: string;
    metadataJson?: string;
  }): Promise<void> {
    const historyId = `qsh_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    await this.db.execute(
      `INSERT INTO qr_status_history (
        id, qr_id, from_status, to_status,
        reason_code, actor_type, actor_id,
        metadata_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        historyId,
        entry.qrId,
        entry.fromStatus,
        entry.toStatus,
        entry.reasonCode,
        entry.actorType,
        entry.actorId ?? null,
        entry.metadataJson ?? null,
        now,
      ]
    );
  }
}
