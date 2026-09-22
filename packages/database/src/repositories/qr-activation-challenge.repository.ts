import type {
  QrActivationChallenge,
  QrActivationChallengeRepository,
} from "@vaahansafe/types";
import type { DatabaseClient } from "../client/d1";

interface DbChallengeRow {
  id: string;
  challenge_token_hash: string;
  qr_id: string;
  public_id: string;
  user_id: string | null;
  proof_verified_at: string;
  expires_at: string;
  consumed_at: string | null;
  created_at: string;
}

export class D1QrActivationChallengeRepository implements QrActivationChallengeRepository {
  constructor(private db: DatabaseClient) {}

  private mapRowToDomain(row: DbChallengeRow): QrActivationChallenge {
    return {
      id: row.id,
      challengeTokenHash: row.challenge_token_hash,
      qrId: row.qr_id,
      publicId: row.public_id,
      userId: row.user_id || undefined,
      proofVerifiedAt: row.proof_verified_at,
      expiresAt: row.expires_at,
      consumedAt: row.consumed_at || undefined,
      createdAt: row.created_at,
    };
  }

  async createChallenge(params: {
    id?: string;
    qrId: string;
    publicId: string;
    tokenHash: string;
    expiresAt: string;
    userId?: string | null;
  }): Promise<QrActivationChallenge> {
    const id = params.id || `qac_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const now = new Date().toISOString();

    await this.db.execute(
      `INSERT INTO qr_activation_challenges (
         id, challenge_token_hash, qr_id, public_id, user_id, proof_verified_at, expires_at, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        params.tokenHash,
        params.qrId,
        params.publicId,
        params.userId ?? null,
        now,
        params.expiresAt,
        now,
      ]
    );

    const challenge = await this.findById(id);
    if (!challenge) {
      throw new Error(`Failed to create activation challenge ${id}`);
    }
    return challenge;
  }

  async findById(id: string): Promise<QrActivationChallenge | null> {
    const row = await this.db.queryFirst<DbChallengeRow>(
      `SELECT id, challenge_token_hash, qr_id, public_id, user_id, proof_verified_at, expires_at, consumed_at, created_at
       FROM qr_activation_challenges
       WHERE id = ?`,
      [id]
    );
    return row ? this.mapRowToDomain(row) : null;
  }

  async findByTokenHash(tokenHash: string): Promise<QrActivationChallenge | null> {
    const row = await this.db.queryFirst<DbChallengeRow>(
      `SELECT id, challenge_token_hash, qr_id, public_id, user_id, proof_verified_at, expires_at, consumed_at, created_at
       FROM qr_activation_challenges
       WHERE challenge_token_hash = ?
         AND consumed_at IS NULL
         AND datetime(expires_at) > datetime('now')`,
      [tokenHash]
    );
    return row ? this.mapRowToDomain(row) : null;
  }

  async attachUser(id: string, userId: string): Promise<boolean> {
    const res = await this.db.execute(
      `UPDATE qr_activation_challenges
       SET user_id = ?
       WHERE id = ? AND consumed_at IS NULL AND datetime(expires_at) > datetime('now')`,
      [userId, id]
    );
    return (res.rowsAffected ?? 0) > 0;
  }

  async consumeChallenge(id: string): Promise<boolean> {
    const now = new Date().toISOString();
    const res = await this.db.execute(
      `UPDATE qr_activation_challenges
       SET consumed_at = ?
       WHERE id = ? AND consumed_at IS NULL`,
      [now, id]
    );
    return (res.rowsAffected ?? 0) > 0;
  }
}
