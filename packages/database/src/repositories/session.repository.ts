import type { Session, SessionRepository } from "@vaahansafe/types";
import type { DatabaseClient } from "../client/d1";

interface DbSessionRow {
  id: string;
  user_id: string;
  token_hash: string;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
  revoked_at: string | null;
  revocation_reason: string | null;
}

export class D1SessionRepository implements SessionRepository {
  constructor(private db: DatabaseClient) {}

  private mapRowToDomain(row: DbSessionRow): Session {
    return {
      id: row.id,
      userId: row.user_id,
      tokenHash: row.token_hash,
      userAgent: row.user_agent || undefined,
      ipAddress: row.ip_address || undefined,
      createdAt: row.created_at,
      lastSeenAt: row.last_seen_at,
      expiresAt: row.expires_at,
      revokedAt: row.revoked_at || undefined,
      revocationReason: row.revocation_reason || undefined,
    };
  }

  async createSession(input: {
    id?: string;
    userId: string;
    tokenHash: string;
    userAgent?: string;
    ipAddress?: string;
    expiresAt: string;
    createdAt?: string;
    lastSeenAt?: string;
  }): Promise<Session> {
    const id = input.id || `ses_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const now = new Date().toISOString();
    const createdAt = input.createdAt || now;
    const lastSeenAt = input.lastSeenAt || createdAt;

    await this.db.execute(
      `INSERT INTO sessions (id, user_id, token_hash, user_agent, ip_address, created_at, last_seen_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.userId,
        input.tokenHash,
        input.userAgent ?? null,
        input.ipAddress ?? null,
        createdAt,
        lastSeenAt,
        input.expiresAt,
      ]
    );

    const session = await this.findById(id);
    if (!session) {
      throw new Error(`Failed to create session ${id}`);
    }
    return session;
  }

  async findById(id: string): Promise<Session | null> {
    const row = await this.db.queryFirst<DbSessionRow>(
      `SELECT id, user_id, token_hash, user_agent, ip_address, created_at, last_seen_at, expires_at, revoked_at, revocation_reason
       FROM sessions WHERE id = ?`,
      [id]
    );
    return row ? this.mapRowToDomain(row) : null;
  }

  async findActiveByTokenHash(tokenHash: string): Promise<Session | null> {
    const row = await this.db.queryFirst<DbSessionRow>(
      `SELECT id, user_id, token_hash, user_agent, ip_address, created_at, last_seen_at, expires_at, revoked_at, revocation_reason
       FROM sessions
       WHERE token_hash = ?
         AND revoked_at IS NULL
         AND datetime(expires_at) > datetime('now')`,
      [tokenHash]
    );
    return row ? this.mapRowToDomain(row) : null;
  }

  async findByUserId(userId: string): Promise<Session[]> {
    const rows = await this.db.query<DbSessionRow>(
      `SELECT id, user_id, token_hash, user_agent, ip_address, created_at, last_seen_at, expires_at, revoked_at, revocation_reason
       FROM sessions
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows.map((r) => this.mapRowToDomain(r));
  }

  async touchSession(tokenHash: string, lastSeenAt?: string): Promise<boolean> {
    const now = lastSeenAt || new Date().toISOString();
    const res = await this.db.execute(
      `UPDATE sessions
       SET last_seen_at = ?
       WHERE token_hash = ?
         AND revoked_at IS NULL
         AND datetime(expires_at) > datetime('now')`,
      [now, tokenHash]
    );
    return (res.rowsAffected ?? 0) > 0;
  }

  async revokeSession(tokenHash: string, reason = "USER_LOGOUT"): Promise<boolean> {
    const now = new Date().toISOString();
    const res = await this.db.execute(
      `UPDATE sessions
       SET revoked_at = ?,
           revocation_reason = ?
       WHERE token_hash = ?
         AND revoked_at IS NULL`,
      [now, reason, tokenHash]
    );
    return (res.rowsAffected ?? 0) > 0;
  }

  async revokeSessionById(id: string, userId: string, reason = "USER_REVOKED"): Promise<boolean> {
    const now = new Date().toISOString();
    const res = await this.db.execute(
      `UPDATE sessions
       SET revoked_at = ?,
           revocation_reason = ?
       WHERE id = ?
         AND user_id = ?
         AND revoked_at IS NULL`,
      [now, reason, id, userId]
    );
    return (res.rowsAffected ?? 0) > 0;
  }

  async revokeAllUserSessions(
    userId: string,
    reason = "LOGOUT_ALL_DEVICES",
    exceptTokenHash?: string
  ): Promise<number> {
    const now = new Date().toISOString();
    let sql = `UPDATE sessions SET revoked_at = ?, revocation_reason = ? WHERE user_id = ? AND revoked_at IS NULL`;
    const params: unknown[] = [now, reason, userId];

    if (exceptTokenHash) {
      sql += ` AND token_hash != ?`;
      params.push(exceptTokenHash);
    }

    const res = await this.db.execute(sql, params);
    return res.rowsAffected ?? 0;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const res = await this.db.execute(
      `DELETE FROM sessions WHERE datetime(expires_at) <= datetime('now', '-30 days')`
    );
    return res.rowsAffected ?? 0;
  }
}
