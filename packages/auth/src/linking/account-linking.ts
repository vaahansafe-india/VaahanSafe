/**
 * VaahanSafe Account Linking & Duplicate Conflict Resolution
 *
 * Section 7.5:
 * "When a user who originally used phone later connects Google, attach the Google identity
 * to the existing user after safe verification. When a Google-first user verifies a phone that
 * is already linked to another account, do not auto-merge; invoke a controlled duplicate-resolution
 * flow with step-up verification and audit logging."
 */

import type {
  User,
  UserRepository,
  AuthIdentityRepository,
  AuditRepository,
} from "@vaahansafe/types";
import { normalizeEmail, normalizePhone } from "../onboarding/first-login-machine";

export class AccountLinkingConflictError extends Error {
  constructor(message: string, public readonly conflictingUserId?: string) {
    super(message);
    this.name = "AccountLinkingConflictError";
  }
}

export interface LinkGoogleResult {
  success: boolean;
  user: User;
  linkedGoogleSub: string;
}

export interface DuplicateResolutionTicket {
  ticketId: string;
  currentUserId: string;
  conflictingUserId: string;
  phone: string;
  status: "REQUIRES_PRIMARY_STEPUP_VERIFICATION";
  createdAt: string;
}

/**
 * Attaches Google Identity to an existing authenticated user (e.g. Phone-first user).
 * Throws AccountLinkingConflictError if Google identity is already claimed by another user.
 */
export async function attachGoogleToExistingUser(
  userId: string,
  googleIdentity: { sub: string; email: string },
  identityRepo: AuthIdentityRepository,
  userRepo: UserRepository,
  auditRepo?: AuditRepository
): Promise<LinkGoogleResult> {
  const normalizedEmail = normalizeEmail(googleIdentity.email);
  const now = new Date().toISOString();

  const existingIdentity = await identityRepo.findByIdentity("GOOGLE", googleIdentity.sub);
  if (existingIdentity) {
    if (existingIdentity.userId !== userId) {
      throw new AccountLinkingConflictError(
        `Google identity (${normalizedEmail}) is already bound to another account (${existingIdentity.userId}).`,
        existingIdentity.userId
      );
    }
    const user = await userRepo.findById(userId);
    return { success: true, user: user!, linkedGoogleSub: googleIdentity.sub };
  }

  // Link identity
  await identityRepo.linkIdentity({
    userId,
    provider: "GOOGLE",
    providerSubject: googleIdentity.sub,
    normalizedIdentifier: normalizedEmail,
    verifiedAt: now,
  });

  // Update primary_email if missing
  let user = await userRepo.findById(userId);
  if (user && !user.email) {
    user = await userRepo.save({
      ...user,
      email: normalizedEmail,
      updatedAt: now,
    });
  }

  if (auditRepo) {
    await auditRepo.record({
      id: `aud_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
      actorId: userId,
      action: "AUTH_IDENTITY_LINKED",
      resourceType: "AUTH_IDENTITY",
      resourceId: googleIdentity.sub,
      after: { provider: "GOOGLE", email: normalizedEmail },
      timestamp: now,
    });
  }

  return {
    success: true,
    user: user!,
    linkedGoogleSub: googleIdentity.sub,
  };
}

/**
 * Initiates controlled duplicate resolution when a Google user inputs a phone
 * already bound to another account.
 * NEVER SILENTLY AUTO-MERGES.
 */
export async function initiateDuplicatePhoneResolution(
  currentUserId: string,
  rawPhone: string,
  identityRepo: AuthIdentityRepository,
  userRepo: UserRepository,
  auditRepo?: AuditRepository
): Promise<DuplicateResolutionTicket> {
  const normalized = normalizePhone(rawPhone);
  const now = new Date().toISOString();

  let conflictingUserId: string | null = null;
  const existingIdentity = await identityRepo.findByIdentity("PHONE", normalized);
  if (existingIdentity) {
    conflictingUserId = existingIdentity.userId;
  } else {
    const existingUser = await userRepo.findByPhone(normalized);
    if (existingUser) {
      conflictingUserId = existingUser.id;
    }
  }

  if (!conflictingUserId || conflictingUserId === currentUserId) {
    throw new Error("No duplicate account conflict detected for this phone number");
  }

  const ticketId = `dup_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

  if (auditRepo) {
    await auditRepo.record({
      id: `aud_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
      actorId: currentUserId,
      action: "DUPLICATE_PHONE_CONFLICT_DETECTED",
      resourceType: "USER_ACCOUNT",
      resourceId: conflictingUserId,
      before: { currentUserId, targetPhone: normalized },
      after: { ticketId, status: "REQUIRES_PRIMARY_STEPUP_VERIFICATION" },
      timestamp: now,
    });
  }

  return {
    ticketId,
    currentUserId,
    conflictingUserId,
    phone: normalized,
    status: "REQUIRES_PRIMARY_STEPUP_VERIFICATION",
    createdAt: now,
  };
}
