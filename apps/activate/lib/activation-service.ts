import {
  getAuthoritativeDatabaseClient,
  getUserRepository,
  getAuthIdentityRepository,
  getSessionRepository,
  getVehicleRepository,
  getQrRepository,
  getQrActivationSecretRepository,
  getQrActivationAttemptRepository,
  getQrActivationChallengeRepository,
} from "@vaahansafe/database";
import {
  verifyScratchSecret,
  calculateNextLockout,
  evaluateSecretAttemptEligibility,
  ALL_ENTITLEMENT_CAPABILITIES,
  GENERIC_SECRET_ERROR_MESSAGE,
} from "@vaahansafe/qr-core";
import { validateSessionToken, parseSessionCookie } from "@vaahansafe/auth";
import {
  hashToken,
  generateChallengeToken,
  parseCookie,
  ACTIVATION_CHALLENGE_COOKIE_NAME,
  ACTIVATION_CHALLENGE_MAX_AGE,
} from "./crypto-helpers";
import type {
  ActivationStage,
  RecognizeResultDto,
  VerifyProofResultDto,
  ActivationSessionDto,
  EligibleVehicleDto,
  ActivationCommitResultDto,
} from "./types";
import { isActivationProofInput, normalizeActivationProofInput } from "./activation-proof-input";
import { activationQrLookup } from "./activation-qr-id";
import { hasVerifiedActivationMobile } from "./activation-account-policy";
export { normalizePublicId } from "./activation-qr-id";

/**
 * Normalizes user-entered or scanned QR ID into canonical format (e.g. vs_99a8b7c6d5e4).
 */

/**
 * Stage 01: Recognize Retail QR & evaluate eligibility safely.
 * Never leaks batch, distributor, or internal owner records.
 */
export async function recognizeRetailQr(
  rawInput: string,
  currentUserId?: string
): Promise<RecognizeResultDto> {
  const { publicId, visibleCode } = activationQrLookup(rawInput);
  if (!publicId || publicId.length < 5) {
    return {
      status: "INVALID",
      message: "Please enter or scan a valid VaahanSafe QR code.",
    };
  }

  const db = getAuthoritativeDatabaseClient();
  const sticker = await db.queryFirst<{
    id: string;
    public_id: string;
    visible_code: string;
    status: string;
    vehicle_id: string | null;
    user_id: string | null;
  }>(
    `SELECT s.id, s.public_id, s.visible_code, s.status, a.vehicle_id, a.user_id
     FROM qr_stickers s
     LEFT JOIN qr_assignments a ON s.id = a.qr_id AND a.ended_at IS NULL
     WHERE s.public_id = ? OR s.visible_code = ?`,
    [publicId, visibleCode]
  );

  if (!sticker) {
    return {
      status: "INVALID",
      message: "We couldn't recognize this VaahanSafe QR. Please check the code and try again.",
    };
  }

  if (sticker.status === "ACTIVATED") {
    // If currently logged-in user owns it, provide friendly guidance
    if (currentUserId && sticker.user_id === currentUserId) {
      return {
        status: "ALREADY_ACTIVATED_BY_YOU",
        publicId: sticker.public_id,
        visibleCode: sticker.visible_code,
        message: "This QR is already activated on your account.",
      };
    }

    return {
      status: "ALREADY_ACTIVATED",
      publicId: sticker.public_id,
      visibleCode: sticker.visible_code,
      message: "This VaahanSafe QR sticker is already active. Sign in to your account if this sticker belongs to you.",
    };
  }

  if (sticker.status === "REPLACED") {
    return {
      status: "REPLACED",
      publicId: sticker.public_id,
      visibleCode: sticker.visible_code,
      message: "This QR sticker has been replaced and cannot be activated.",
    };
  }

  if (sticker.status === "BLOCKED" || sticker.status === "LOST_DAMAGED") {
    return {
      status: "UNAVAILABLE",
      publicId: sticker.public_id,
      visibleCode: sticker.visible_code,
      message: "This sticker is currently unavailable for activation. Please contact VaahanSafe Support.",
    };
  }

  if (sticker.status === "EXPIRED_UNSOLD") {
    return {
      status: "EXPIRED",
      publicId: sticker.public_id,
      visibleCode: sticker.visible_code,
      message: "This retail package has expired. Please contact your retailer or VaahanSafe Support.",
    };
  }

  // Retail acquisition must be recorded before possession proof can enable service.
  if (sticker.status !== "SOLD") {
    return {
      status: "UNAVAILABLE",
      message: "This QR is not ready for activation yet. Please contact your retailer or VaahanSafe Support.",
    };
  }

  return {
    status: "ELIGIBLE",
    publicId: sticker.public_id,
    visibleCode: sticker.visible_code,
  };
}

/**
 * Stage 02: Verify Physical Possession Proof (scratch code)
 * Enforces rate limiting, constant-time hash check, and issues a 15-minute challenge.
 */
export async function verifyActivationProof(params: {
  publicId: string;
  scratchCode: string;
  clientIp?: string;
  userAgent?: string;
  currentUserId?: string;
}): Promise<
  VerifyProofResultDto & { challengeToken?: string; publicId?: string; visibleCode?: string }
> {
  const { publicId, visibleCode } = activationQrLookup(params.publicId);
  const candidateSecret = isActivationProofInput(params.scratchCode) ? normalizeActivationProofInput(params.scratchCode) : "";

  if (!publicId || !candidateSecret) {
    return {
      success: false,
      error: "Both QR code and scratch verification code are required.",
    };
  }

  const db = getAuthoritativeDatabaseClient();
  const sticker = await db.queryFirst<{
    id: string;
    public_id: string;
    visible_code: string;
    status: string;
  }>(`SELECT id, public_id, visible_code, status FROM qr_stickers WHERE public_id = ? OR visible_code = ?`, [
    publicId, visibleCode,
  ]);

  if (!sticker) {
    return {
      success: false,
      error: GENERIC_SECRET_ERROR_MESSAGE,
    };
  }

  // Re-verify the retail acquisition gate before checking the secret.
  if (sticker.status !== "SOLD") {
    return {
      success: false,
      error: GENERIC_SECRET_ERROR_MESSAGE,
    };
  }

  const secretRepo = getQrActivationSecretRepository(db);
  const attemptRepo = getQrActivationAttemptRepository(db);
  const challengeRepo = getQrActivationChallengeRepository(db);

  const secretRecord = await secretRepo.findByQrId(sticker.id);
  if (!secretRecord) {
    // Audit attempt for unknown secret
    await attemptRepo.recordAttempt({
      qrId: sticker.id,
      userId: params.currentUserId,
      outcome: "INVALID_SECRET",
      failureReasonCode: "SECRET_RECORD_NOT_FOUND",
      ipHash: params.clientIp ? await hashToken(params.clientIp) : undefined,
    });
    return {
      success: false,
      error: GENERIC_SECRET_ERROR_MESSAGE,
    };
  }

  // Check lockout or previous consumption
  const eligibility = evaluateSecretAttemptEligibility(
    secretRecord.consumedAt,
    secretRecord.lockedUntil
  );
  if (!eligibility.canAttempt) {
    await attemptRepo.recordAttempt({
      qrId: sticker.id,
      userId: params.currentUserId,
      outcome: eligibility.errorCode === "SECRET_LOCKED" ? "QR_LOCKED" : "ALREADY_ACTIVATED",
      failureReasonCode: eligibility.errorCode,
      ipHash: params.clientIp ? await hashToken(params.clientIp) : undefined,
    });
    return {
      success: false,
      isLocked: eligibility.errorCode === "SECRET_LOCKED",
      lockedUntil: secretRecord.lockedUntil || undefined,
      error: eligibility.errorMessage || GENERIC_SECRET_ERROR_MESSAGE,
    };
  }

  // Constant-time hash verification
  const isValid = await verifyScratchSecret(
    candidateSecret,
    secretRecord.secretHash,
    secretRecord.hashVersion
  );

  if (!isValid) {
    const lockout = calculateNextLockout(secretRecord.failedAttempts);
    await secretRepo.recordFailedAttempt(sticker.id, lockout.lockedUntil);
    await attemptRepo.recordAttempt({
      qrId: sticker.id,
      userId: params.currentUserId,
      outcome: lockout.isNewlyLocked ? "QR_LOCKED" : "INVALID_SECRET",
      failureReasonCode: "HASH_MISMATCH",
      ipHash: params.clientIp ? await hashToken(params.clientIp) : undefined,
    });

    return {
      success: false,
      isLocked: lockout.isNewlyLocked,
      lockedUntil: lockout.lockedUntil || undefined,
      error: lockout.isNewlyLocked
        ? "Too many failed verification attempts. Activation has been temporarily locked for security."
        : GENERIC_SECRET_ERROR_MESSAGE,
    };
  }

  // Success: reset failed attempts
  await secretRepo.resetFailedAttempts(sticker.id);

  // Generate short-lived activation challenge
  const challengeToken = generateChallengeToken();
  const tokenHash = await hashToken(challengeToken);
  const expiresAt = new Date(Date.now() + ACTIVATION_CHALLENGE_MAX_AGE * 1000).toISOString();

  await challengeRepo.createChallenge({
    qrId: sticker.id,
    publicId: sticker.public_id,
    tokenHash,
    expiresAt,
    userId: params.currentUserId,
  });

  await attemptRepo.recordAttempt({
    qrId: sticker.id,
    userId: params.currentUserId,
    outcome: "SUCCESS",
    ipHash: params.clientIp ? await hashToken(params.clientIp) : undefined,
  });

  return {
    success: true,
    challengeToken,
    publicId: sticker.public_id,
    visibleCode: sticker.visible_code,
    expiresAt,
  };
}

/**
 * Resolves current ceremony progress and authenticated user from incoming cookies.
 */
export async function getActivationSession(
  cookieHeader: string | null | undefined
): Promise<ActivationSessionDto> {
  const db = getAuthoritativeDatabaseClient();
  const challengeRepo = getQrActivationChallengeRepository(db);

  // 1. Resolve User Session if present
  const authenticatedUser = await getActivationUser(cookieHeader);

  // 2. Resolve Activation Challenge if present
  const rawChallengeToken = parseCookie(cookieHeader, ACTIVATION_CHALLENGE_COOKIE_NAME);
  let challengeDto: ActivationSessionDto["challenge"] = null;

  if (rawChallengeToken) {
    const tokenHash = await hashToken(rawChallengeToken);
    const challenge = await challengeRepo.findByTokenHash(tokenHash);

    if (challenge) {
      const sticker = await db.queryFirst<{ visible_code: string }>(
        `SELECT visible_code FROM qr_stickers WHERE id = ?`,
        [challenge.qrId]
      );

      // If user authenticated after challenge was created, attach user to challenge in Supabase
      if (authenticatedUser && !challenge.userId) {
        await challengeRepo.attachUser(challenge.id, authenticatedUser.id);
      }

      if (sticker) {
        challengeDto = {
          valid: true,
          publicId: challenge.publicId,
          visibleCode: sticker.visible_code,
          expiresAt: challenge.expiresAt,
        };
      }
    }
  }

  // 3. Derive current canonical ceremony stage. Vehicle eligibility is fetched
  // only when the vehicle step mounts, avoiding an unnecessary database count.
  let stage: ActivationStage = "RECOGNIZE";
  if (!challengeDto) {
    stage = "RECOGNIZE";
  } else if (!authenticatedUser || !authenticatedUser.phoneVerified) {
    stage = "IDENTITY";
  } else {
    stage = "VEHICLE";
  }

  return {
    stage,
    challenge: challengeDto,
    user: authenticatedUser,
  };
}

/** Resolve the existing account from a valid server session, never a supplied ID. */
export async function getActivationUser(
  cookieHeader: string | null | undefined,
): Promise<ActivationSessionDto["user"]> {
  const rawToken = parseSessionCookie(cookieHeader);
  if (!rawToken) return null;
  const db = getAuthoritativeDatabaseClient();
  const session = await validateSessionToken(rawToken, getSessionRepository(db));
  if (!session) return null;
  const [user, identities] = await Promise.all([
    getUserRepository(db).findById(session.userId),
    getAuthIdentityRepository(db).findByUserId(session.userId),
  ]);
  if (!user || user.status !== "ACTIVE") return null;
  return {
    id: user.id,
    name: user.name || null,
    phone: user.phone || null,
    email: user.email || null,
    phoneVerified: hasVerifiedActivationMobile(user, identities),
    maskedPhone: user.phone ? `+91 ••••• ${user.phone.slice(-4)}` : null,
  };
}

/**
 * Stage 04: Fetch vehicles owned by user with their active QR assignment status.
 */
export async function getEligibleVehicles(userId: string): Promise<EligibleVehicleDto[]> {
  const db = getAuthoritativeDatabaseClient();
  const rows = await db.query<{
    id: string;
    registration_number: string;
    vehicle_type: string;
    make: string;
    model: string;
    color: string | null;
    active_assignment_id: string | null;
  }>(
    `SELECT v.id, v.registration_number, v.vehicle_type, v.make, v.model, v.color,
            a.id as active_assignment_id
     FROM vehicles v
     LEFT JOIN qr_assignments a ON v.id = a.vehicle_id AND a.ended_at IS NULL
     WHERE v.user_id = ? AND v.status != 'DELETED'
     ORDER BY v.created_at DESC`,
    [userId]
  );

  return rows.map((r) => {
    const reg = r.registration_number || "";
    const masked =
      reg.length >= 6
        ? `${reg.slice(0, 4)} •••• ${reg.slice(-4)}`
        : reg;

    return {
      id: r.id,
      registrationNumber: reg,
      maskedRegistration: masked,
      make: r.make,
      model: r.model,
      vehicleType: r.vehicle_type as any,
      primaryColor: r.color || undefined,
      hasActiveQr: Boolean(r.active_assignment_id),
    };
  });
}

/**
 * Stage 06: Atomic + Idempotent Activation Commitment
 * Verifies all 6 proofs atomically and binds the QR sticker to the vehicle.
 */
export async function activateRetailQr(params: {
  challengeToken: string;
  vehicleId: string;
  userId: string;
  clientIp?: string;
  userAgent?: string;
}): Promise<ActivationCommitResultDto> {
  const db = getAuthoritativeDatabaseClient();
  const challengeRepo = getQrActivationChallengeRepository(db);
  const secretRepo = getQrActivationSecretRepository(db);
  const userRepo = getUserRepository(db);
  const vehicleRepo = getVehicleRepository(db);
  const attemptRepo = getQrActivationAttemptRepository(db);

  // 1. Re-verify Challenge Proof
  const tokenHash = await hashToken(params.challengeToken);
  const challenge = await challengeRepo.findByTokenHash(tokenHash);

  if (!challenge) {
    return {
      success: false,
      error: "Your activation session has expired. Please verify your physical QR code again.",
    };
  }

  // 2. Re-verify Authenticated User & Mobile Verification
  const user = await userRepo.findById(params.userId);
  const identities = await getAuthIdentityRepository(db).findByUserId(params.userId);
  const isUserPhoneVerified = hasVerifiedActivationMobile(user, identities);
  if (!user || !isUserPhoneVerified) {
    return {
      success: false,
      error: "A verified mobile number is required before activating your QR sticker.",
    };
  }

  // If challenge is tied to a different user, reject
  if (challenge.userId && challenge.userId !== user.id) {
    return {
      success: false,
      error: "Security verification mismatch. Please restart the activation process.",
    };
  }

  // 3. Re-verify QR Sticker Claimability (TOCTOU protection)
  const sticker = await db.queryFirst<{
    id: string;
    public_id: string;
    visible_code: string;
    status: string;
    active_assignment_id: string | null;
  }>(
    `SELECT s.id, s.public_id, s.visible_code, s.status, a.id as active_assignment_id
     FROM qr_stickers s
     LEFT JOIN qr_assignments a ON s.id = a.qr_id AND a.ended_at IS NULL
     WHERE s.id = ?`,
    [challenge.qrId]
  );

  if (!sticker) {
    return { success: false, error: "QR sticker record not found." };
  }

  if (sticker.status === "ACTIVATED" || sticker.active_assignment_id) {
    return {
      success: false,
      error: "This QR sticker has already been activated.",
    };
  }

  // 4. Re-verify Vehicle Eligibility (Must belong to user and have no active QR)
  const vehicle = await vehicleRepo.findById(params.vehicleId);
  if (!vehicle || vehicle.customerId !== user.id) {
    return {
      success: false,
      error: "Selected vehicle could not be found on your account.",
    };
  }

  const existingVehicleAssignment = await db.queryFirst<{ id: string }>(
    `SELECT id FROM qr_assignments WHERE vehicle_id = ? AND ended_at IS NULL`,
    [vehicle.id]
  );

  if (existingVehicleAssignment) {
    return {
      success: false,
      error: "This vehicle already has an active QR sticker attached. Use Replace QR to swap stickers.",
    };
  }

  // 5. Atomic Commitment in Supabase Database
  const assignmentId = `qra_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const historyId = `qsh_${crypto.randomUUID().replace(/-/g, "")}`;
  const now = new Date().toISOString();

  await db.batch([
    // Lock the sticker and vehicle before the claim. The partial unique indexes
    // in the Supabase migration remain the final double-claim boundary.
    {
      sql: `INSERT INTO qr_assignments (id, qr_id, vehicle_id, user_id, assignment_type, assigned_at, created_at)
            SELECT ?, s.id, v.id, ${db.dialect === "postgres" ? "u.id::text" : "u.id"}, 'INITIAL', ?, ?
            FROM qr_stickers s
            JOIN qr_activation_secrets sec ON sec.qr_id = s.id
            JOIN qr_activation_challenges ch ON ch.qr_id = s.id
            JOIN vehicles v ON v.id = ? AND v.user_id = ? AND v.status != 'DELETED'
            JOIN users u ON ${db.dialect === "postgres" ? "u.id::text = v.user_id" : "u.id = v.user_id"}
            WHERE s.id = ? AND s.status = 'SOLD' AND sec.consumed_at IS NULL
              AND ch.id = ? AND ch.consumed_at IS NULL AND ${db.dialect === "postgres" ? "ch.expires_at > CURRENT_TIMESTAMP" : "datetime(ch.expires_at) > datetime('now')"}
              AND (ch.user_id IS NULL OR ${db.dialect === "postgres" ? "ch.user_id = u.id::text" : "ch.user_id = u.id"})
              AND u.status = 'ACTIVE' AND u.onboarding_status IN ('PROFILE_REQUIRED', 'COMPLETED')
              AND EXISTS (SELECT 1 FROM auth_identities ai WHERE ai.user_id = u.id
                AND ai.provider = 'PHONE' AND ai.${db.dialect === "postgres" ? "provider_user_id" : "provider_subject"} = u.primary_phone
                AND ai.verified_at IS NOT NULL)
              AND NOT EXISTS (SELECT 1 FROM qr_assignments a WHERE a.vehicle_id = v.id AND a.ended_at IS NULL)
            FOR UPDATE OF s, v`,
      params: [assignmentId, now, now, vehicle.id, user.id, sticker.id, challenge.id],
    },
    {
      sql: `UPDATE qr_stickers
            SET status = 'ACTIVATED',
                activated_at = ?,
                updated_at = ?
            WHERE id = ? AND status = 'SOLD'
              AND EXISTS (SELECT 1 FROM qr_assignments WHERE id = ?)`,
      params: [now, now, sticker.id, assignmentId],
    },
    {
      sql: `INSERT INTO qr_status_history (
              id, qr_id, from_status, to_status, reason_code, actor_type, actor_id, metadata_json, created_at
            ) SELECT ?, ?, 'SOLD', 'ACTIVATED', 'RETAIL_ACTIVATION', 'USER', ?, ?, ?
              WHERE EXISTS (SELECT 1 FROM qr_assignments WHERE id = ?)`,
      params: [
        historyId,
        sticker.id,
        user.id,
        JSON.stringify({ vehicleId: vehicle.id, assignmentId }),
        now,
        assignmentId,
      ],
    },
    {
      sql: `UPDATE qr_activation_secrets
            SET consumed_at = ?, updated_at = ?
            WHERE qr_id = ? AND consumed_at IS NULL
              AND EXISTS (SELECT 1 FROM qr_assignments WHERE id = ?)`,
      params: [now, now, sticker.id, assignmentId],
    },
    {
      sql: `UPDATE qr_activation_challenges
            SET consumed_at = ?
            WHERE id = ? AND consumed_at IS NULL
              AND EXISTS (SELECT 1 FROM qr_assignments WHERE id = ?)`,
      params: [now, challenge.id, assignmentId],
    },
    ...ALL_ENTITLEMENT_CAPABILITIES.map((capability) => ({
      sql: `INSERT INTO service_entitlements (
              id, user_id, vehicle_id, qr_sticker_id, capability,
              status, acquisition_source, verified_at, created_at, updated_at
            ) SELECT ?, ?, ?, ?, ?, 'ENABLED', 'RETAIL_ACTIVATION', ?, ?, ?
              WHERE EXISTS (SELECT 1 FROM qr_assignments WHERE id = ?)
                AND EXISTS (SELECT 1 FROM qr_stickers WHERE id = ? AND status = 'ACTIVATED')`,
      params: [
        `ent_${crypto.randomUUID().replace(/-/g, "")}`,
        user.id,
        vehicle.id,
        sticker.id,
        capability,
        now,
        now,
        now,
        assignmentId,
        sticker.id,
      ],
    })),
  ]);

  const committed = await db.queryFirst<{ id: string }>(
    `SELECT id FROM qr_assignments WHERE id = ? AND ended_at IS NULL`,
    [assignmentId]
  );
  if (!committed) {
    return { success: false, error: "This QR could not be activated. Please refresh and try again." };
  }

  // Record additional non-critical audit telemetry after the transactional commit.
  await attemptRepo.recordAttempt({
    qrId: sticker.id,
    userId: user.id,
    outcome: "SUCCESS",
    ipHash: params.clientIp ? await hashToken(params.clientIp) : undefined,
  });

  return {
    success: true,
    publicId: sticker.public_id,
    visibleCode: sticker.visible_code,
    vehicleReference: `${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber})`,
    activatedAt: now,
  };
}
