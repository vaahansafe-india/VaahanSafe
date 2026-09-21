import { cookies } from "next/headers";
import { CUSTOMER_SESSION_COOKIE_NAME, validateSessionToken } from "@vaahansafe/auth";
import { getSessionRepository, getUserRepository } from "@vaahansafe/database";
import type { User, Session } from "@vaahansafe/types";

export interface AuthenticatedCustomerSession {
  user: User;
  session: Session;
}

/**
 * Validates the incoming customer session cookie against authoritative Cloudflare D1
 * and retrieves the user identity profile.
 */
export async function getAuthenticatedCustomer(): Promise<AuthenticatedCustomerSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(CUSTOMER_SESSION_COOKIE_NAME)?.value;
    if (!sessionToken) {
      return null;
    }

    const sessionRepo = getSessionRepository();
    const session = await validateSessionToken(sessionToken, sessionRepo);
    if (!session) {
      return null;
    }

    const userRepo = getUserRepository();
    const user = await userRepo.findById(session.userId);
    if (!user) {
      return null;
    }

    return { user, session };
  } catch (err) {
    console.error("[VaahanSafe] Error fetching authenticated customer:", err);
    return null;
  }
}
