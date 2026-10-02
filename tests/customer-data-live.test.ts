import { beforeAll, describe, expect, it } from "vitest";
import nextEnv from "@next/env";
import { getAuthoritativeDatabaseClient, getSessionRepository, getUserRepository, getAuthIdentityRepository } from "@vaahansafe/database";
import { getCustomerData } from "../apps/customer/lib/customer-data-service";
import type { AuthenticatedCustomerSession } from "../apps/customer/lib/session";
import type { CustomerResource } from "../apps/customer/lib/customer-query-contract";

// Explicitly enabled read-only checks use existing records. They never create accounts or sessions.
describe.skipIf(process.env.VAAHANSAFE_LIVE_READ_CHECK !== "1")("Live customer read models", () => {
  let auth: AuthenticatedCustomerSession;
  beforeAll(async () => {
    nextEnv.loadEnvConfig("apps/customer", true);
    const record = await getAuthoritativeDatabaseClient().queryFirst<{ id: string }>(
      `SELECT s.id FROM sessions s JOIN users u ON u.id = s.user_id
       LEFT JOIN vehicles v ON v.user_id = u.id::text AND v.status != 'DELETED'
       WHERE s.revoked_at IS NULL AND s.expires_at > now() AND u.status = 'ACTIVE'
       GROUP BY s.id, u.id ORDER BY count(v.id) DESC, s.created_at DESC LIMIT 1`
    );
    if (!record) throw new Error("No existing active session available for read-only checks");
    const session = await getSessionRepository().findById(record.id);
    if (!session) throw new Error("Session unavailable");
    const [user, identities] = await Promise.all([getUserRepository().findById(session.userId), getAuthIdentityRepository().findByUserId(session.userId)]);
    if (!user) throw new Error("Account unavailable");
    auth = { session, user,
      phoneVerified: identities.some(i => i.provider === "PHONE" && Boolean(i.verifiedAt)),
      googleVerified: identities.some(i => i.provider === "GOOGLE" && Boolean(i.verifiedAt)),
    };
  }, 30_000);
  const resources: CustomerResource[] = ["shell", "dashboard", "vehicles", "orders", "payments", "scan-history", "notifications", "emergency-contacts", "subscription", "settings", "qr", "qr-codes", "qr-buy", "qr-activate", "qr-replace"];
  it.each(resources)("loads %s from existing production records", async resource => {
    const start = performance.now();
    const data = await getCustomerData(resource, auth, new URLSearchParams());
    expect(data).toBeDefined();
    console.log("Live read timing", { resource, milliseconds: Math.round(performance.now() - start) });
  }, 30_000);
});
