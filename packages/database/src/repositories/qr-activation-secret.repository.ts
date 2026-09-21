import type {
  QrActivationSecretRecord,
  QrActivationSecretRepository,
} from "@vaahansafe/types";
import type { DatabaseClient } from "../client/d1";

interface DbSecretRow {
  id: string;
  qr_id: string;
  secret_hash: string;
  hash_version: string;
  failed_attempts: number;
  locked_until: string | null;
  consumed_at: string | null;
  created_at: string;
  updated_at: string;
}

export class D1QrActivationSecretRepository implements QrActivationSecretRepository {
  constructor(private db: DatabaseClient) {}

  private mapRowToDomain(row: DbSecretRow): QrActivationSecretRecord {
    return {
      id: row.id,
      qrId: row.qr_id,
      secretHash: row.secret_hash,
      hashVersion: row.hash_version,
      failedAttempts: row.failed_attempts,
      lockedUntil: row.locked_until || undefined,
      consumedAt: row.consumed_at || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findByQrId(qrId: string): Promise<QrActivationSecretRecord | null> {
    const row = await this.db.queryFirst<DbSecretRow>(
      `SELECT id, qr_id, secret_hash, hash_version, failed_attempts, locked_until, consumed_at, created_at, updated_at
       FROM qr_activation_secrets WHERE qr_id = ?`,
      [qrId]
    );
    return row ? this.mapRowToDomain(row) : null;
  }

  async saveSecret(input: {
    id?: string;
    qrId: string;
    secretHash: string;
    hashVersion?: string;
    failedAttempts?: number;
    lockedUntil?: string | null;
    consumedAt?: string | null;
  }): Promise<QrActivationSecretRecord> {
    const existing = await this.findByQrId(input.qrId);
    const now = new Date().toISOString();

    if (existing) {
      await this.db.execute(
        `UPDATE qr_activation_secrets
         SET secret_hash = COALESCE(?, secret_hash),
             hash_version = COALESCE(?, hash_version),
             failed_attempts = COALESCE(?, failed_attempts),
             locked_until = ?,
             consumed_at = ?,
             updated_at = ?
         WHERE qr_id = ?`,
        [
          input.secretHash ?? null,
          input.hashVersion ?? null,
          input.failedAttempts ?? null,
          input.lockedUntil !== undefined ? input.lockedUntil : existing.lockedUntil ?? null,
          input.consumedAt !== undefined ? input.consumedAt : existing.consumedAt ?? null,
          now,
          input.qrId,
        ]
      );
    } else {
      const id = input.id || `sec_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
      await this.db.execute(
        `INSERT INTO qr_activation_secrets (id, qr_id, secret_hash, hash_version, failed_attempts, locked_until, consumed_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.qrId,
          input.secretHash,
          input.hashVersion || "v1",
          input.failedAttempts ?? 0,
          input.lockedUntil ?? null,
          input.consumedAt ?? null,
          now,
          now,
        ]
      );
    }

    const updated = await this.findByQrId(input.qrId);
    if (!updated) {
      throw new Error(`Failed to save QR activation secret for QR ${input.qrId}`);
    }
    return updated;
  }

  async recordFailedAttempt(qrId: string, lockedUntil?: string | null): Promise<QrActivationSecretRecord> {
    const now = new Date().toISOString();
    await this.db.execute(
      `UPDATE qr_activation_secrets
       SET failed_attempts = failed_attempts + 1,
           locked_until = COALESCE(?, locked_until),
           updated_at = ?
       WHERE qr_id = ?`,
      [lockedUntil ?? null, now, qrId]
    );

    const updated = await this.findByQrId(qrId);
    if (!updated) {
      throw new Error(`Secret not found for QR ${qrId}`);
    }
    return updated;
  }

  async resetFailedAttempts(qrId: string): Promise<QrActivationSecretRecord> {
    const now = new Date().toISOString();
    await this.db.execute(
      `UPDATE qr_activation_secrets
       SET failed_attempts = 0,
           locked_until = NULL,
           updated_at = ?
       WHERE qr_id = ?`,
      [now, qrId]
    );

    const updated = await this.findByQrId(qrId);
    if (!updated) {
      throw new Error(`Secret not found for QR ${qrId}`);
    }
    return updated;
  }

  async consumeSecret(qrId: string): Promise<QrActivationSecretRecord> {
    const now = new Date().toISOString();
    await this.db.execute(
      `UPDATE qr_activation_secrets
       SET consumed_at = ?,
           updated_at = ?
       WHERE qr_id = ? AND consumed_at IS NULL`,
      [now, now, qrId]
    );

    const updated = await this.findByQrId(qrId);
    if (!updated || !updated.consumedAt) {
      throw new Error(`Failed to consume secret for QR ${qrId} (may already be consumed)`);
    }
    return updated;
  }
}
