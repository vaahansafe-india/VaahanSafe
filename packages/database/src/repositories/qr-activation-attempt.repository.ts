import type {
  QrActivationAttemptRecord,
  QrActivationAttemptRepository,
} from "@vaahansafe/types";
import type { DatabaseClient } from "../client/d1";

export class D1QrActivationAttemptRepository implements QrActivationAttemptRepository {
  constructor(private db: DatabaseClient) {}

  async recordAttempt(input: {
    id?: string;
    qrId: string;
    userId?: string;
    outcome: QrActivationAttemptRecord["outcome"];
    failureReasonCode?: string;
    requestFingerprintHash?: string;
    ipHash?: string;
  }): Promise<void> {
    const id = input.id || `att_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const now = new Date().toISOString();

    await this.db.execute(
      `INSERT INTO qr_activation_attempts (id, qr_id, user_id, outcome, failure_reason_code, request_fingerprint_hash, ip_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.qrId,
        input.userId ?? null,
        input.outcome,
        input.failureReasonCode ?? null,
        input.requestFingerprintHash ?? null,
        input.ipHash ?? null,
        now,
      ]
    );
  }

  async countRecentAttempts(qrId: string, windowSeconds = 900): Promise<number> {
    const row = await this.db.queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM qr_activation_attempts
       WHERE qr_id = ?
         AND datetime(created_at) >= datetime('now', '-' || ? || ' seconds')`,
      [qrId, windowSeconds]
    );
    return row?.count ?? 0;
  }
}
