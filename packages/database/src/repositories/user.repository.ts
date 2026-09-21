import type { User, UserRepository, UserId } from "@vaahansafe/types";
import type { DatabaseClient } from "../client/d1";

interface DbUserRow {
  id: string;
  primary_phone: string | null;
  primary_email: string | null;
  full_name: string | null;
  onboarding_status: string;
  status: string;
  terms_accepted_at: string | null;
  privacy_accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export class D1UserRepository implements UserRepository {
  constructor(private db: DatabaseClient) {}

  private mapRowToDomain(row: DbUserRow): User {
    return {
      id: row.id,
      phone: row.primary_phone || undefined,
      email: row.primary_email || undefined,
      name: row.full_name || undefined,
      role: "CUSTOMER",
      onboardingState: (row.onboarding_status as User["onboardingState"]) || "AUTHENTICATED",
      status: (row.status as User["status"]) || "ACTIVE",
      termsAcceptedAt: row.terms_accepted_at || undefined,
      privacyAcceptedAt: row.privacy_accepted_at || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findById(id: UserId | string): Promise<User | null> {
    const row = await this.db.queryFirst<DbUserRow>(
      "SELECT id, primary_phone, primary_email, full_name, onboarding_status, status, terms_accepted_at, privacy_accepted_at, created_at, updated_at FROM users WHERE id = ?",
      [id]
    );
    return row ? this.mapRowToDomain(row) : null;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const row = await this.db.queryFirst<DbUserRow>(
      "SELECT id, primary_phone, primary_email, full_name, onboarding_status, status, terms_accepted_at, privacy_accepted_at, created_at, updated_at FROM users WHERE primary_phone = ?",
      [phone]
    );
    return row ? this.mapRowToDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db.queryFirst<DbUserRow>(
      "SELECT id, primary_phone, primary_email, full_name, onboarding_status, status, terms_accepted_at, privacy_accepted_at, created_at, updated_at FROM users WHERE primary_email = ?",
      [email]
    );
    return row ? this.mapRowToDomain(row) : null;
  }

  async save(user: Partial<User> & { id: string }): Promise<User> {
    const existing = await this.findById(user.id);
    const now = new Date().toISOString();

    if (existing) {
      await this.db.execute(
        `UPDATE users SET 
           primary_phone = COALESCE(?, primary_phone),
           primary_email = COALESCE(?, primary_email),
           full_name = COALESCE(?, full_name),
           onboarding_status = COALESCE(?, onboarding_status),
           status = COALESCE(?, status),
           terms_accepted_at = COALESCE(?, terms_accepted_at),
           privacy_accepted_at = COALESCE(?, privacy_accepted_at),
           updated_at = ?
         WHERE id = ?`,
        [
          user.phone ?? null,
          user.email ?? null,
          user.name ?? null,
          user.onboardingState ?? null,
          user.status ?? null,
          user.termsAcceptedAt ?? null,
          user.privacyAcceptedAt ?? null,
          now,
          user.id,
        ]
      );
    } else {
      await this.db.execute(
        `INSERT INTO users (id, primary_phone, primary_email, full_name, onboarding_status, status, terms_accepted_at, privacy_accepted_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          user.phone ?? null,
          user.email ?? null,
          user.name ?? null,
          user.onboardingState ?? "AUTHENTICATED",
          user.status ?? "ACTIVE",
          user.termsAcceptedAt ?? null,
          user.privacyAcceptedAt ?? null,
          user.createdAt || now,
          now,
        ]
      );
    }

    const updated = await this.findById(user.id);
    if (!updated) {
      throw new Error(`Failed to save user ${user.id}`);
    }
    return updated;
  }
}
