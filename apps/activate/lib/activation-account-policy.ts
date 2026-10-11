import type { AuthIdentity, User } from "@vaahansafe/types";

/** A saved phone or onboarding flag alone is not proof of mobile ownership. */
export function hasVerifiedActivationMobile(
  user: User | null,
  identities: AuthIdentity[],
): boolean {
  return Boolean(
    user?.status === "ACTIVE" &&
      user.phone &&
      (user.onboardingState === "PROFILE_REQUIRED" || user.onboardingState === "COMPLETED") &&
      identities.some(
        (identity) =>
          identity.userId === user.id &&
          identity.provider === "PHONE" &&
          identity.providerSubject === user.phone &&
          Boolean(identity.verifiedAt),
      ),
  );
}
