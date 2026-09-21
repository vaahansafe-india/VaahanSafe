/**
 * VaahanSafe First-Login Rules & Onboarding State Machine
 *
 * Section 7.1:
 * ENTRY
 *  ├─ Continue with Mobile → MSG91 OTP → phone verified
 *  └─ Continue with Google → Google identity verified
 *                                   ↓
 *                            mobile required
 *                                   ↓
 *                              MSG91 OTP
 *                                   ↓
 *                          COMPLETE PROFILE
 *                                   ↓
 *                              APP READY
 *
 * CRITICAL INVARIANTS:
 * 1. A Google-authenticated account is not fully onboarded until mobile verification is complete.
 * 2. A mobile-first account must NOT be asked to verify the same mobile again during onboarding.
 * 3. Never auto-merge when a Google user enters a phone already bound to another account (Section 7.5).
 */

import type {
  User,
  UserRepository,
  AuthIdentityRepository,
  OnboardingState,
} from "@vaahansafe/types";

export type OnboardingStep = "VERIFY_MOBILE" | "COMPLETE_PROFILE" | "APP_READY";

export interface MobileLoginResult {
  user: User;
  isNewUser: boolean;
  nextStep: "COMPLETE_PROFILE" | "APP_READY";
}

export interface GoogleLoginResult {
  user: User;
  isNewUser: boolean;
  nextStep: OnboardingStep;
}

export interface VerifyMobileResult {
  success: boolean;
  conflict?: boolean;
  existingUserId?: string;
  error?: string;
  user?: User;
  nextStep?: "COMPLETE_PROFILE";
}

export interface CompleteProfileInput {
  name: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

export function normalizePhone(rawPhone: string): string {
  const cleaned = rawPhone.trim().replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("+")) {
    return cleaned;
  }
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  return `+${cleaned}`;
}

export function normalizeEmail(rawEmail: string): string {
  return rawEmail.trim().toLowerCase();
}

/**
 * Mobile-First Entry:
 * Customer enters mobile number -> MSG91 OTP verified.
 * INVARIANT: Mobile is ALREADY verified; must NEVER ask to verify mobile again.
 */
export async function handleMobileEntry(
  phone: string,
  userRepo: UserRepository,
  identityRepo: AuthIdentityRepository
): Promise<MobileLoginResult> {
  const normalized = normalizePhone(phone);
  const now = new Date().toISOString();

  // 1. Check existing identity
  const existingIdentity = await identityRepo.findByIdentity("PHONE", normalized);
  let user: User | null = null;

  if (existingIdentity) {
    user = await userRepo.findById(existingIdentity.userId);
  } else {
    // Check by user primary_phone directly
    user = await userRepo.findByPhone(normalized);
  }

  if (user) {
    // Ensure identity record is linked
    if (!existingIdentity) {
      await identityRepo.linkIdentity({
        userId: user.id,
        provider: "PHONE",
        providerSubject: normalized,
        normalizedIdentifier: normalized,
        verifiedAt: now,
      });
    }

    // INVARIANT: If user was stuck in PHONE_REQUIRED, advance to PROFILE_REQUIRED
    // because mobile OTP was just successfully verified.
    if (user.onboardingState === "PHONE_REQUIRED" || user.onboardingState === "AUTHENTICATED") {
      user = await userRepo.save({
        ...user,
        onboardingState: "PROFILE_REQUIRED",
      });
    }

    const nextStep = user.onboardingState === "COMPLETED" ? "APP_READY" : "COMPLETE_PROFILE";
    return {
      user,
      isNewUser: false,
      nextStep,
    };
  }

  // New User Creation
  const newUserId = `usr_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const createdUser = await userRepo.save({
    id: newUserId,
    phone: normalized,
    role: "CUSTOMER",
    onboardingState: "PROFILE_REQUIRED",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  });

  await identityRepo.linkIdentity({
    userId: createdUser.id,
    provider: "PHONE",
    providerSubject: normalized,
    normalizedIdentifier: normalized,
    verifiedAt: now,
  });

  return {
    user: createdUser,
    isNewUser: true,
    nextStep: "COMPLETE_PROFILE",
  };
}

/**
 * Google-First Entry:
 * Customer authenticates via Google identity -> Google identity verified.
 * INVARIANT: Mobile required before onboarding can proceed to completion.
 */
export async function handleGoogleEntry(
  googleIdentity: { sub: string; email: string; name?: string },
  userRepo: UserRepository,
  identityRepo: AuthIdentityRepository
): Promise<GoogleLoginResult> {
  const normalizedEmail = normalizeEmail(googleIdentity.email);
  const now = new Date().toISOString();

  // Check existing Google identity
  const existingIdentity = await identityRepo.findByIdentity("GOOGLE", googleIdentity.sub);
  if (existingIdentity) {
    const user = await userRepo.findById(existingIdentity.userId);
    if (!user) {
      throw new Error(`User not found for identity ${existingIdentity.id}`);
    }

    let nextStep: OnboardingStep = "VERIFY_MOBILE";
    if (user.onboardingState === "PROFILE_REQUIRED") {
      nextStep = "COMPLETE_PROFILE";
    } else if (user.onboardingState === "COMPLETED") {
      nextStep = "APP_READY";
    }

    return {
      user,
      isNewUser: false,
      nextStep,
    };
  }

  // Check if user exists with primary_email
  const existingUserByEmail = await userRepo.findByEmail(normalizedEmail);
  if (existingUserByEmail) {
    // Attach Google identity to existing user
    await identityRepo.linkIdentity({
      userId: existingUserByEmail.id,
      provider: "GOOGLE",
      providerSubject: googleIdentity.sub,
      normalizedIdentifier: normalizedEmail,
      verifiedAt: now,
    });

    let nextStep: OnboardingStep = "VERIFY_MOBILE";
    if (existingUserByEmail.onboardingState === "PROFILE_REQUIRED") {
      nextStep = "COMPLETE_PROFILE";
    } else if (existingUserByEmail.onboardingState === "COMPLETED") {
      nextStep = "APP_READY";
    }

    return {
      user: existingUserByEmail,
      isNewUser: false,
      nextStep,
    };
  }

  // New Google user created
  const newUserId = `usr_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const createdUser = await userRepo.save({
    id: newUserId,
    email: normalizedEmail,
    name: googleIdentity.name,
    role: "CUSTOMER",
    onboardingState: "PHONE_REQUIRED",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  });

  await identityRepo.linkIdentity({
    userId: createdUser.id,
    provider: "GOOGLE",
    providerSubject: googleIdentity.sub,
    normalizedIdentifier: normalizedEmail,
    verifiedAt: now,
  });

  return {
    user: createdUser,
    isNewUser: true,
    nextStep: "VERIFY_MOBILE",
  };
}

/**
 * Mobile Verification for Google-First User:
 * Customer enters mobile number -> MSG91 OTP verified.
 *
 * SECTION 7.5 ANTI-MERGE RULE:
 * "When a Google-first user verifies a phone that is already linked to another account,
 * do not auto-merge; invoke a controlled duplicate-resolution flow with step-up verification."
 */
export async function verifyMobileForGoogleUser(
  userId: string,
  phone: string,
  userRepo: UserRepository,
  identityRepo: AuthIdentityRepository
): Promise<VerifyMobileResult> {
  const normalized = normalizePhone(phone);
  const now = new Date().toISOString();

  // 1. Check if phone is linked to another user
  const existingIdentity = await identityRepo.findByIdentity("PHONE", normalized);
  if (existingIdentity && existingIdentity.userId !== userId) {
    return {
      success: false,
      conflict: true,
      existingUserId: existingIdentity.userId,
      error: "DUPLICATE_PHONE_CONFLICT",
    };
  }

  const existingUserByPhone = await userRepo.findByPhone(normalized);
  if (existingUserByPhone && existingUserByPhone.id !== userId) {
    return {
      success: false,
      conflict: true,
      existingUserId: existingUserByPhone.id,
      error: "DUPLICATE_PHONE_CONFLICT",
    };
  }

  // 2. Valid and unconflicted: link phone identity
  await identityRepo.linkIdentity({
    userId,
    provider: "PHONE",
    providerSubject: normalized,
    normalizedIdentifier: normalized,
    verifiedAt: now,
  });

  // 3. Advance user status to PROFILE_REQUIRED
  const user = await userRepo.findById(userId);
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  const updatedUser = await userRepo.save({
    ...user,
    phone: normalized,
    onboardingState: "PROFILE_REQUIRED",
    updatedAt: now,
  });

  return {
    success: true,
    user: updatedUser,
    nextStep: "COMPLETE_PROFILE",
  };
}

/**
 * Profile Completion:
 * Customer enters full name, accepts Terms of Service and Privacy Policy.
 * Onboarding progresses to COMPLETED -> APP READY.
 */
export async function completeUserProfile(
  userId: string,
  input: CompleteProfileInput,
  userRepo: UserRepository
): Promise<{ user: User; nextStep: "APP_READY" }> {
  if (!input.termsAccepted || !input.privacyAccepted) {
    throw new Error("Terms of Service and Privacy Policy must be accepted to complete onboarding");
  }

  const user = await userRepo.findById(userId);
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  const now = new Date().toISOString();
  const updated = await userRepo.save({
    ...user,
    name: input.name.trim(),
    termsAcceptedAt: now,
    privacyAcceptedAt: now,
    onboardingState: "COMPLETED",
    updatedAt: now,
  });

  return {
    user: updated,
    nextStep: "APP_READY",
  };
}
