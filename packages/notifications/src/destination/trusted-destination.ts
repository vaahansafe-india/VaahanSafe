/**
 * Trusted Destination Resolver
 *
 * Resolves verified contact destinations (phone/email) exclusively from authoritative
 * account data in D1.
 *
 * INVARIANT: Arbitrary browser-supplied phone/email parameters MUST NEVER be trusted
 * for transactional notifications to prevent redirection/spoofing attacks.
 */

import { NotificationCategory } from "../domain/category";

export interface AccountContactProfile {
  userId: string;
  verifiedPhone?: string;
  verifiedEmail?: string;
  phoneVerifiedAt?: string;
  emailVerifiedAt?: string;
}

export interface ResolvedDestination {
  userId: string;
  phone?: string;
  email?: string;
  source: "ACCOUNT_VERIFIED" | "SNAPSHOT";
}

export class DestinationResolutionError extends Error {
  constructor(public readonly userId: string, message: string) {
    super(`Failed to resolve destination for user "${userId}": ${message}`);
    this.name = "DestinationResolutionError";
  }
}

/**
 * Resolves trusted destinations for a recipient.
 *
 * @param profile Authoritative account profile loaded from database
 * @param category Notification category (SECURITY category requires snapshot or verified profile)
 * @param snapshotDestination Optional snapshot taken at the exact moment of security event creation
 */
export function resolveTrustedDestination(
  profile: AccountContactProfile,
  category: NotificationCategory,
  snapshotDestination?: { phone?: string; email?: string }
): ResolvedDestination {
  // For critical SECURITY events, prefer the snapshot captured at event creation time
  // so that an attacker changing a phone/email cannot silence an alert directed to the original owner.
  if (category === "SECURITY" && snapshotDestination && (snapshotDestination.phone || snapshotDestination.email)) {
    return {
      userId: profile.userId,
      phone: snapshotDestination.phone || profile.verifiedPhone,
      email: snapshotDestination.email || profile.verifiedEmail,
      source: "SNAPSHOT",
    };
  }

  return {
    userId: profile.userId,
    phone: profile.verifiedPhone,
    email: profile.verifiedEmail,
    source: "ACCOUNT_VERIFIED",
  };
}
