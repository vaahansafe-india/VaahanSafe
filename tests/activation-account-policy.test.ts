import { describe, expect, it } from "vitest";
import type { AuthIdentity, User } from "@vaahansafe/types";
import { hasVerifiedActivationMobile } from "../apps/activate/lib/activation-account-policy";

const user: User = {
  id: "account-policy-test",
  phone: "+919876543210",
  role: "CUSTOMER",
  status: "ACTIVE",
  onboardingState: "COMPLETED",
  createdAt: "2026-10-12T00:00:00Z",
  updatedAt: "2026-10-12T00:00:00Z",
};
const phone: AuthIdentity = {
  id: "identity-policy-test",
  userId: user.id,
  provider: "PHONE",
  providerSubject: user.phone!,
  verifiedAt: "2026-10-12T00:00:00Z",
  createdAt: "2026-10-12T00:00:00Z",
  updatedAt: "2026-10-12T00:00:00Z",
};

describe("Activation account reuse security", () => {
  it("continues verified accounts without requiring profile completion or another OTP", () => {
    expect(hasVerifiedActivationMobile(user, [phone])).toBe(true);
    expect(hasVerifiedActivationMobile({ ...user, onboardingState: "PROFILE_REQUIRED" }, [phone])).toBe(true);
  });
  it("requires verification for signed-out, Google-only and saved-phone-only users", () => {
    expect(hasVerifiedActivationMobile(null, [])).toBe(false);
    expect(hasVerifiedActivationMobile(user, [])).toBe(false);
    expect(hasVerifiedActivationMobile(user, [{ ...phone, provider: "GOOGLE" }])).toBe(false);
    expect(hasVerifiedActivationMobile(user, [{ ...phone, verifiedAt: undefined }])).toBe(false);
  });
  it("rejects a verified identity for another account or a previous mobile number", () => {
    expect(hasVerifiedActivationMobile(user, [{ ...phone, userId: "another-account" }])).toBe(false);
    expect(hasVerifiedActivationMobile({ ...user, phone: "+919876543211" }, [phone])).toBe(false);
  });
  it("does not reuse inactive accounts or accounts still awaiting mobile verification", () => {
    expect(hasVerifiedActivationMobile({ ...user, status: "SUSPENDED" }, [phone])).toBe(false);
    expect(hasVerifiedActivationMobile({ ...user, onboardingState: "PHONE_REQUIRED" }, [phone])).toBe(false);
    expect(hasVerifiedActivationMobile({ ...user, onboardingState: "AUTHENTICATED" }, [phone])).toBe(false);
  });
});
