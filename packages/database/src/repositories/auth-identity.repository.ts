import type { AuthIdentity, AuthIdentityRepository, AuthProvider } from "@vaahansafe/types";
import type { DatabaseClient } from "../client/d1";

interface DbAuthIdentityRow {
  id: string;
  user_id: string;
  provider: string;
  provider_subject: string;
  normalized_identifier: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export class D1AuthIdentityRepository implements AuthIdentityRepository {
  constructor(private db: DatabaseClient) {}

  private mapRowToDomain(row: DbAuthIdentityRow): AuthIdentity {
    return {
      id: row.id,
      userId: row.user_id,
      provider: row.provider as AuthProvider,
      providerSubject: row.provider_subject,
      normalizedIdentifier: row.normalized_identifier || undefined,
      verifiedAt: row.verified_at || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findById(id: string): Promise<AuthIdentity | null> {
    const row = await this.db.queryFirst<DbAuthIdentityRow>(
      `SELECT id, user_id, provider, provider_subject, normalized_identifier, verified_at, created_at, updated_at
       FROM auth_identities WHERE id = ?`,
      [id]
    );
    return row ? this.mapRowToDomain(row) : null;
  }

  async findByIdentity(provider: AuthProvider, providerSubject: string): Promise<AuthIdentity | null> {
    const row = await this.db.queryFirst<DbAuthIdentityRow>(
      `SELECT id, user_id, provider, provider_subject, normalized_identifier, verified_at, created_at, updated_at
       FROM auth_identities WHERE provider = ? AND provider_subject = ?`,
      [provider, providerSubject]
    );
    return row ? this.mapRowToDomain(row) : null;
  }

  async findByUserId(userId: string): Promise<AuthIdentity[]> {
    const rows = await this.db.query<DbAuthIdentityRow>(
      `SELECT id, user_id, provider, provider_subject, normalized_identifier, verified_at, created_at, updated_at
       FROM auth_identities WHERE user_id = ? ORDER BY created_at ASC`,
      [userId]
    );
    return rows.map((r) => this.mapRowToDomain(r));
  }

  async findByNormalizedIdentifier(provider: AuthProvider, normalizedIdentifier: string): Promise<AuthIdentity[]> {
    const rows = await this.db.query<DbAuthIdentityRow>(
      `SELECT id, user_id, provider, provider_subject, normalized_identifier, verified_at, created_at, updated_at
       FROM auth_identities WHERE provider = ? AND normalized_identifier = ?`,
      [provider, normalizedIdentifier]
    );
    return rows.map((r) => this.mapRowToDomain(r));
  }

  async linkIdentity(input: {
    id?: string;
    userId: string;
    provider: AuthProvider;
    providerSubject: string;
    normalizedIdentifier?: string;
    verifiedAt?: string;
  }): Promise<AuthIdentity> {
    const existing = await this.findByIdentity(input.provider, input.providerSubject);
    const now = new Date().toISOString();

    if (existing) {
      if (existing.userId !== input.userId) {
        throw new Error(
          `[AuthConflictError] Identity ${input.provider}:${input.providerSubject} is already linked to another account (${existing.userId}). Cannot auto-merge.`
        );
      }
      // Update verified_at / normalized_identifier if needed
      await this.db.execute(
        `UPDATE auth_identities
         SET normalized_identifier = COALESCE(?, normalized_identifier),
             verified_at = COALESCE(?, verified_at),
             updated_at = ?
         WHERE id = ?`,
        [input.normalizedIdentifier ?? null, input.verifiedAt ?? null, now, existing.id]
      );
      const updated = await this.findById(existing.id);
      return updated!;
    }

    const id = input.id || `aid_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    await this.db.execute(
      `INSERT INTO auth_identities (id, user_id, provider, provider_subject, normalized_identifier, verified_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.userId,
        input.provider,
        input.providerSubject,
        input.normalizedIdentifier ?? null,
        input.verifiedAt ?? now,
        now,
        now,
      ]
    );

    const created = await this.findById(id);
    if (!created) {
      throw new Error(`Failed to link identity ${input.provider}:${input.providerSubject}`);
    }
    return created;
  }

  async unlinkIdentity(userId: string, provider: AuthProvider): Promise<boolean> {
    const res = await this.db.execute(
      `DELETE FROM auth_identities WHERE user_id = ? AND provider = ?`,
      [userId, provider]
    );
    return (res.rowsAffected ?? 0) > 0;
  }
}
