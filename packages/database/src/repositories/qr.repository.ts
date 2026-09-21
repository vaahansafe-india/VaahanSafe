import type {
  QrLifecycleState,
  QrPublicId,
  QrRepository,
  QrSticker,
} from "@vaahansafe/types";
import type { DatabaseClient } from "../client/d1";

interface DbStickerRow {
  id: string;
  public_id: string;
  visible_code: string;
  batch_id: string;
  status: string;
  activated_at: string | null;
  replaced_by_qr_id: string | null;
  created_at: string;
  updated_at: string;
  vehicle_id?: string | null;
  user_id?: string | null;
}

export class D1QrRepository implements QrRepository {
  constructor(private db: DatabaseClient) {}

  private mapRowToDomain(row: DbStickerRow): QrSticker {
    return {
      id: row.id,
      batchId: row.batch_id,
      publicId: row.public_id,
      status: row.status as QrLifecycleState,
      vehicleId: row.vehicle_id || undefined,
      activatedAt: row.activated_at || undefined,
      activatedByUserId: row.user_id || undefined,
      replacementForStickerId: undefined, // tracked in sticker_replacements
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findByPublicId(publicId: QrPublicId | string): Promise<QrSticker | null> {
    const row = await this.db.queryFirst<DbStickerRow>(
      `SELECT s.id, s.public_id, s.visible_code, s.batch_id, s.status, s.activated_at, s.replaced_by_qr_id, s.created_at, s.updated_at,
              a.vehicle_id, a.user_id
       FROM qr_stickers s
       LEFT JOIN qr_assignments a ON s.id = a.qr_id AND a.ended_at IS NULL
       WHERE s.public_id = ?`,
      [publicId]
    );
    return row ? this.mapRowToDomain(row) : null;
  }

  async findById(id: string): Promise<QrSticker | null> {
    const row = await this.db.queryFirst<DbStickerRow>(
      `SELECT s.id, s.public_id, s.visible_code, s.batch_id, s.status, s.activated_at, s.replaced_by_qr_id, s.created_at, s.updated_at,
              a.vehicle_id, a.user_id
       FROM qr_stickers s
       LEFT JOIN qr_assignments a ON s.id = a.qr_id AND a.ended_at IS NULL
       WHERE s.id = ?`,
      [id]
    );
    return row ? this.mapRowToDomain(row) : null;
  }

  async save(sticker: Partial<QrSticker> & { id: string }): Promise<QrSticker> {
    const existing = await this.findById(sticker.id);
    const now = new Date().toISOString();

    if (existing) {
      await this.db.execute(
        `UPDATE qr_stickers SET
           status = COALESCE(?, status),
           activated_at = COALESCE(?, activated_at),
           updated_at = ?
         WHERE id = ?`,
        [sticker.status ?? null, sticker.activatedAt ?? null, now, sticker.id]
      );
    } else {
      if (!sticker.batchId || !sticker.publicId) {
        throw new Error("Missing batchId or publicId to create sticker");
      }
      await this.db.execute(
        `INSERT INTO qr_stickers (id, public_id, visible_code, batch_id, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          sticker.id,
          sticker.publicId,
          `VS-${sticker.publicId}`,
          sticker.batchId,
          sticker.status || "PRINTED",
          sticker.createdAt || now,
          now,
        ]
      );
    }

    const updated = await this.findById(sticker.id);
    if (!updated) {
      throw new Error(`Failed to save QR sticker ${sticker.id}`);
    }
    return updated;
  }

  async transitionStatus(
    stickerId: string,
    nextStatus: string,
    context?: Record<string, unknown>
  ): Promise<QrSticker> {
    const current = await this.findById(stickerId);
    if (!current) {
      throw new Error(`QR Sticker ${stickerId} not found`);
    }

    const now = new Date().toISOString();
    const historyId = `qsh_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const reasonCode = (context?.reasonCode as string) || "STATUS_TRANSITION";
    const actorType = (context?.actorType as string) || "SYSTEM";
    const actorId = (context?.actorId as string) || null;
    const metadataJson = context ? JSON.stringify(context) : null;

    // Use atomic batch operations
    await this.db.batch([
      {
        sql: `UPDATE qr_stickers SET status = ?, updated_at = ? WHERE id = ?`,
        params: [nextStatus, now, stickerId],
      },
      {
        sql: `INSERT INTO qr_status_history (id, qr_id, from_status, to_status, reason_code, actor_type, actor_id, metadata_json, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          historyId,
          stickerId,
          current.status,
          nextStatus,
          reasonCode,
          actorType,
          actorId,
          metadataJson,
          now,
        ],
      },
    ]);

    const updated = await this.findById(stickerId);
    if (!updated) {
      throw new Error(`Failed to retrieve updated sticker ${stickerId}`);
    }
    return updated;
  }
}
