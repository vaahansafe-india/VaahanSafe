import { createClient } from "@supabase/supabase-js";
import type {
  AuthIdentity,
  AuthIdentityRepository,
  AuthProvider,
  User,
  UserRepository,
  Session,
  SessionRepository,
} from "@vaahansafe/types";

/** Privileged client for server domain operations only; never use in browser code. */
export function getSupabaseAdminClient() {
  if ("window" in globalThis)
    throw new Error("Server database access required");
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase server configuration is missing");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function mapUser(row: Record<string, any>): User {
  return {
    id: row.id,
    phone: row.primary_phone || row.phone || undefined,
    email: row.primary_email || row.email || undefined,
    name: row.full_name || undefined,
    role: row.role,
    status: row.status,
    onboardingState: row.onboarding_status,
    termsAcceptedAt: row.terms_accepted_at || undefined,
    privacyAcceptedAt: row.privacy_accepted_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseUserRepository implements UserRepository {
  private async find(column: string, value: string): Promise<User | null> {
    const { data, error } = await getSupabaseAdminClient()
      .from("users")
      .select("*")
      .eq(column, value)
      .maybeSingle();
    if (error) throw error;
    return data ? mapUser(data) : null;
  }
  findById(id: string) {
    return this.find("id", id);
  }
  async findByPhone(phone: string) {
    return (
      (await this.find("phone", phone)) || this.find("primary_phone", phone)
    );
  }
  async findByEmail(email: string) {
    return (
      (await this.find("email", email)) || this.find("primary_email", email)
    );
  }
  async save(user: Partial<User> & { id: string }): Promise<User> {
    const existing = await this.findById(user.id);
    // Identity conflicts must be resolved explicitly; never silently merge accounts.
    if (user.phone) {
      const owner = await this.findByPhone(user.phone);
      if (owner && owner.id !== user.id)
        throw new Error("Phone identity conflict");
    }
    if (user.email) {
      const owner = await this.findByEmail(user.email);
      if (owner && owner.id !== user.id)
        throw new Error("Email identity conflict");
    }
    const record = {
      ...(user.phone !== undefined
        ? { phone: user.phone, primary_phone: user.phone }
        : {}),
      ...(user.email !== undefined
        ? { email: user.email, primary_email: user.email }
        : {}),
      ...(user.name !== undefined ? { full_name: user.name } : {}),
      ...(user.role !== undefined ? { role: user.role } : {}),
      ...(user.status !== undefined ? { status: user.status } : {}),
      ...(user.onboardingState !== undefined
        ? { onboarding_status: user.onboardingState }
        : {}),
      ...(user.termsAcceptedAt
        ? { terms_accepted_at: user.termsAcceptedAt }
        : {}),
      ...(user.privacyAcceptedAt
        ? { privacy_accepted_at: user.privacyAcceptedAt }
        : {}),
      updated_at: new Date().toISOString(),
    };
    const query = getSupabaseAdminClient().from("users");
    const { data, error } = existing
      ? await query.update(record).eq("id", user.id).select().single()
      : await query
          .insert({ id: user.id, full_name: "", ...record })
          .select()
          .single();
    if (error) throw error;
    return mapUser(data);
  }
}

function mapIdentity(row: Record<string, any>): AuthIdentity {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    providerSubject: row.provider_user_id,
    normalizedIdentifier: row.normalized_identifier || undefined,
    verifiedAt: row.verified_at,
    createdAt: row.created_at,
    updatedAt: row.created_at,
  };
}

export class SupabaseAuthIdentityRepository implements AuthIdentityRepository {
  async findById(id: string) {
    const { data, error } = await getSupabaseAdminClient()
      .from("auth_identities")
      .select()
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapIdentity(data) : null;
  }
  async findByIdentity(provider: AuthProvider, subject: string) {
    const { data, error } = await getSupabaseAdminClient()
      .from("auth_identities")
      .select()
      .eq("provider", provider)
      .eq("provider_user_id", subject)
      .maybeSingle();
    if (error) throw error;
    return data ? mapIdentity(data) : null;
  }
  async findByUserId(userId: string) {
    const { data, error } = await getSupabaseAdminClient()
      .from("auth_identities")
      .select()
      .eq("user_id", userId)
      .order("created_at");
    if (error) throw error;
    return (data || []).map(mapIdentity);
  }
  async findByNormalizedIdentifier(provider: AuthProvider, identifier: string) {
    if (provider === "PHONE") {
      const identity = await this.findByIdentity(provider, identifier);
      return identity ? [identity] : [];
    }
    const user = await new SupabaseUserRepository().findByEmail(identifier);
    return user
      ? (await this.findByUserId(user.id)).filter(
          (identity) => identity.provider === provider,
        )
      : [];
  }
  async linkIdentity(input: {
    id?: string;
    userId: string;
    provider: AuthProvider;
    providerSubject: string;
    normalizedIdentifier?: string;
    verifiedAt?: string;
  }) {
    const existing = await this.findByIdentity(
      input.provider,
      input.providerSubject,
    );
    if (existing && existing.userId !== input.userId)
      throw new Error("Identity is linked to another account");
    const record = {
      user_id: input.userId,
      provider: input.provider,
      provider_user_id: input.providerSubject,
      verified_at: input.verifiedAt || new Date().toISOString(),
    };
    const query = getSupabaseAdminClient().from("auth_identities");
    const { data, error } = existing
      ? await query
          .update({ verified_at: record.verified_at })
          .eq("id", existing.id)
          .select()
          .single()
      : await query
          .insert({ id: input.id || crypto.randomUUID(), ...record })
          .select()
          .single();
    if (error) throw error;
    return mapIdentity(data);
  }
  async unlinkIdentity(userId: string, provider: AuthProvider) {
    const { data, error } = await getSupabaseAdminClient()
      .from("auth_identities")
      .delete()
      .eq("user_id", userId)
      .eq("provider", provider)
      .select("id");
    if (error) throw error;
    return Boolean(data?.length);
  }
}

function mapSession(row: Record<string, any>): Session {
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

export class SupabaseSessionRepository implements SessionRepository {
  /** One authoritative request validates the session and reads its account identities. */
  async findActiveAccountByTokenHash(
    hash: string,
  ): Promise<{
    session: Session;
    user: User;
    identities: AuthIdentity[];
  } | null> {
    const { data, error } = await getSupabaseAdminClient()
      .from("sessions")
      .select("*, users!inner(*, auth_identities(*))")
      .eq("token_hash", hash)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
      .eq("users.status", "ACTIVE")
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const account = data.users as unknown as Record<string, any>;
    if (!account || account.id !== data.user_id || account.status !== "ACTIVE")
      return null;
    return {
      session: mapSession(data),
      user: mapUser(account),
      identities: (account.auth_identities || []).map(mapIdentity),
    };
  }

  async createSession(
    input: Parameters<SessionRepository["createSession"]>[0],
  ) {
    const now = new Date().toISOString();
    const { data, error } = await getSupabaseAdminClient()
      .from("sessions")
      .insert({
        id: input.id || crypto.randomUUID(),
        user_id: input.userId,
        token_hash: input.tokenHash,
        user_agent: input.userAgent || null,
        ip_address: input.ipAddress || null,
        created_at: input.createdAt || now,
        last_seen_at: input.lastSeenAt || now,
        expires_at: input.expiresAt,
      })
      .select()
      .single();
    if (error) throw error;
    return mapSession(data);
  }
  async findById(id: string) {
    const { data, error } = await getSupabaseAdminClient()
      .from("sessions")
      .select()
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapSession(data) : null;
  }
  async findActiveByTokenHash(hash: string) {
    const { data, error } = await getSupabaseAdminClient()
      .from("sessions")
      .select()
      .eq("token_hash", hash)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (error) throw error;
    return data ? mapSession(data) : null;
  }
  async findByUserId(id: string) {
    const { data, error } = await getSupabaseAdminClient()
      .from("sessions")
      .select()
      .eq("user_id", id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(mapSession);
  }
  async touchSession(hash: string, lastSeenAt = new Date().toISOString()) {
    const { data, error } = await getSupabaseAdminClient()
      .from("sessions")
      .update({ last_seen_at: lastSeenAt })
      .eq("token_hash", hash)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
      .select("id");
    if (error) throw error;
    return Boolean(data?.length);
  }
  async revokeSession(hash: string, reason = "USER_LOGOUT") {
    const { data, error } = await getSupabaseAdminClient()
      .from("sessions")
      .update({
        revoked_at: new Date().toISOString(),
        revocation_reason: reason,
      })
      .eq("token_hash", hash)
      .is("revoked_at", null)
      .select("id");
    if (error) throw error;
    return Boolean(data?.length);
  }
  async revokeSessionById(id: string, userId: string, reason = "USER_REVOKED") {
    const { data, error } = await getSupabaseAdminClient()
      .from("sessions")
      .update({
        revoked_at: new Date().toISOString(),
        revocation_reason: reason,
      })
      .eq("id", id)
      .eq("user_id", userId)
      .is("revoked_at", null)
      .select("id");
    if (error) throw error;
    return Boolean(data?.length);
  }
  async revokeAllUserSessions(
    id: string,
    reason = "LOGOUT_ALL_DEVICES",
    exceptHash?: string,
  ) {
    let query = getSupabaseAdminClient()
      .from("sessions")
      .update({
        revoked_at: new Date().toISOString(),
        revocation_reason: reason,
      })
      .eq("user_id", id)
      .is("revoked_at", null);
    if (exceptHash) query = query.neq("token_hash", exceptHash);
    const { data, error } = await query.select("id");
    if (error) throw error;
    return data?.length || 0;
  }
  async cleanupExpiredSessions() {
    const { data, error } = await getSupabaseAdminClient()
      .from("sessions")
      .delete()
      .lte("expires_at", new Date(Date.now() - 30 * 86400000).toISOString())
      .select("id");
    if (error) throw error;
    return data?.length || 0;
  }
}
