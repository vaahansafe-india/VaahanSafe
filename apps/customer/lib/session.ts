import { cookies } from "next/headers";
import { cache } from "react";
import {
  CUSTOMER_SESSION_COOKIE_NAME,
  validateSessionToken,
  hashSessionToken,
} from "@vaahansafe/auth";
import {
  getSessionRepository,
  getUserRepository,
  getAuthIdentityRepository,
  SupabaseSessionRepository,
} from "@vaahansafe/database";
import type { User, Session } from "@vaahansafe/types";

export interface AuthenticatedCustomerSession {
  user: User;
  session: Session;
  phoneVerified: boolean;
  googleVerified: boolean;
}

/** Supabase authenticates Google and MSG91 authenticates phone OTP.
 * Both establish the same revocable HttpOnly session in Supabase Postgres. */
export const getAuthenticatedCustomer = cache(
  async (): Promise<AuthenticatedCustomerSession | null> => {
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    if (token.length < 32 || token.length > 256) return null;
    const repository = getSessionRepository();
    if (repository instanceof SupabaseSessionRepository) {
      const hash = await hashSessionToken(token);
      const account = await repository.findActiveAccountByTokenHash(hash);
      if (!account) return null;
      const lastSeen = Date.parse(account.session.lastSeenAt);
      if (
        !Number.isFinite(lastSeen) ||
        Date.now() - lastSeen >= 5 * 60 * 1000
      ) {
        if (!(await repository.touchSession(hash))) return null;
      }
      return {
        user: account.user,
        session: account.session,
        phoneVerified: account.identities.some(
          (identity) =>
            identity.provider === "PHONE" &&
            identity.providerSubject === account.user.phone &&
            Boolean(identity.verifiedAt),
        ),
        googleVerified: account.identities.some(
          (identity) =>
            identity.provider === "GOOGLE" && Boolean(identity.verifiedAt),
        ),
      };
    }
    const session = await validateSessionToken(token, repository);
    if (!session) return null;
    const [user, identities] = await Promise.all([
      getUserRepository().findById(session.userId),
      getAuthIdentityRepository().findByUserId(session.userId),
    ]);
    if (!user || user.status !== "ACTIVE") return null;
    return {
      user,
      session,
      phoneVerified: identities.some(
        (identity) =>
          identity.provider === "PHONE" &&
          identity.providerSubject === user.phone &&
          Boolean(identity.verifiedAt),
      ),
      googleVerified: identities.some(
        (identity) =>
          identity.provider === "GOOGLE" && Boolean(identity.verifiedAt),
      ),
    };
  },
);
