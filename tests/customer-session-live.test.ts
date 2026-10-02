import { describe, expect, it } from "vitest";
import {
  getAuthoritativeDatabaseClient,
  getSessionRepository,
  getUserRepository,
  getAuthIdentityRepository,
  SupabaseSessionRepository,
} from "@vaahansafe/database";

describe.skipIf(process.env.VAAHANSAFE_LIVE_READ_CHECK !== "1")(
  "Combined customer session reads",
  () => {
    it("returns the same existing account and identities in one request", async () => {
      const record = await getAuthoritativeDatabaseClient().queryFirst<{
        token_hash: string;
      }>(
        `SELECT s.token_hash FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.revoked_at IS NULL AND s.expires_at > now() AND u.status = 'ACTIVE'
       ORDER BY s.created_at DESC LIMIT 1`,
      );
      if (!record)
        throw new Error(
          "No existing active session available for read-only verification",
        );
      const session = await getSessionRepository().findActiveByTokenHash(
        record.token_hash,
      );
      expect(session).not.toBeNull();
      const [user, identities, joined] = await Promise.all([
        getUserRepository().findById(session!.userId),
        getAuthIdentityRepository().findByUserId(session!.userId),
        new SupabaseSessionRepository().findActiveAccountByTokenHash(
          record.token_hash,
        ),
      ]);
      expect(joined?.session).toEqual(session);
      expect(joined?.user).toEqual(user);
      expect(joined?.identities.map((i) => i.id).sort()).toEqual(
        identities.map((i) => i.id).sort(),
      );
    }, 30_000);

    it("rejects an unknown session without creating any account", async () => {
      const hash = crypto.randomUUID().replaceAll("-", "").repeat(2);
      expect(
        await new SupabaseSessionRepository().findActiveAccountByTokenHash(
          hash,
        ),
      ).toBeNull();
    }, 30_000);

    it("excludes expired, revoked, and inactive account sessions", async ({
      skip,
    }) => {
      const records = await getAuthoritativeDatabaseClient().query<{
        token_hash: string;
      }>(
        `SELECT s.token_hash FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.revoked_at IS NOT NULL OR s.expires_at <= now() OR u.status != 'ACTIVE'
       ORDER BY s.created_at DESC LIMIT 5`,
      );
      if (!records.length) skip();
      for (const record of records)
        expect(
          await new SupabaseSessionRepository().findActiveAccountByTokenHash(
            record.token_hash,
          ),
        ).toBeNull();
    }, 30_000);
  },
);
