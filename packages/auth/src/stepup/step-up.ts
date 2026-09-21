/**
 * VaahanSafe Step-Up Verification
 *
 * Section 7.3:
 * "Sensitive actions can require step-up OTP:
 * - phone change
 * - QR ownership transfer
 * - account deletion
 * - high-risk admin actions"
 *
 * Plus Section 7.5:
 * - duplicate account resolution challenge
 */

import type { StepUpChallenge, StepUpPurpose } from "@vaahansafe/types";
import { hashSessionToken } from "../tokens/session-token";

export const MAX_STEP_UP_ATTEMPTS = 3;
export const DEFAULT_STEP_UP_TTL_MINUTES = 10;

/**
 * Generates a cryptographically random 6-digit OTP string.
 */
export function generateStepUpOtp(): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    const val = arr[0] ?? 0;
    const num = (val % 900000) + 100000;
    return num.toString();
  }
  const nodeCrypto = require("crypto");
  const num = nodeCrypto.randomInt(100000, 999999);
  return num.toString();
}

/**
 * Creates a step-up challenge and returns the challenge object (with code hash)
 * along with the plaintext OTP to be dispatched via SMS/WhatsApp/Email.
 */
export async function createStepUpChallenge(
  userId: string,
  purpose: StepUpPurpose,
  channel: "PHONE" | "EMAIL",
  recipient: string,
  options: {
    targetResource?: string;
    ttlMinutes?: number;
    challengeId?: string;
  } = {}
): Promise<{ challenge: StepUpChallenge; plaintextOtp: string }> {
  const challengeId = options.challengeId || `ch_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const plaintextOtp = generateStepUpOtp();
  const codeHash = await hashSessionToken(`${challengeId}:${plaintextOtp}`);
  const ttl = options.ttlMinutes ?? DEFAULT_STEP_UP_TTL_MINUTES;
  const expiresAt = new Date(Date.now() + ttl * 60 * 1000).toISOString();

  const challenge: StepUpChallenge = {
    id: challengeId,
    userId,
    purpose,
    targetResource: options.targetResource,
    channel,
    recipient,
    codeHash,
    expiresAt,
    attempts: 0,
  };

  return { challenge, plaintextOtp };
}

export interface VerifyStepUpResult {
  success: boolean;
  error?: string;
  challenge: StepUpChallenge;
}

/**
 * Verifies user-supplied OTP against step-up challenge.
 */
export async function verifyStepUpChallenge(
  challenge: StepUpChallenge,
  inputOtp: string
): Promise<VerifyStepUpResult> {
  const updatedChallenge: StepUpChallenge = { ...challenge };

  if (updatedChallenge.verifiedAt) {
    return {
      success: false,
      error: "Step-up challenge has already been consumed",
      challenge: updatedChallenge,
    };
  }

  const now = new Date();
  if (now > new Date(updatedChallenge.expiresAt)) {
    return {
      success: false,
      error: "Step-up challenge has expired",
      challenge: updatedChallenge,
    };
  }

  if (updatedChallenge.attempts >= MAX_STEP_UP_ATTEMPTS) {
    return {
      success: false,
      error: "Maximum verification attempts exceeded. Please request a new code.",
      challenge: updatedChallenge,
    };
  }

  updatedChallenge.attempts += 1;
  const expectedHash = await hashSessionToken(`${updatedChallenge.id}:${inputOtp.trim()}`);

  if (expectedHash !== updatedChallenge.codeHash) {
    return {
      success: false,
      error: "Invalid verification code",
      challenge: updatedChallenge,
    };
  }

  updatedChallenge.verifiedAt = now.toISOString();

  return {
    success: true,
    challenge: updatedChallenge,
  };
}
