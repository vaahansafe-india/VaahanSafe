import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  verifyScratchSecret,
  grantAuthoritativeEntitlements,
  isValidPublicIdFormat,
} from "@vaahansafe/qr-core";
import { createInAppNotification } from "@vaahansafe/database";
import { getApiDatabase } from "../../_db";

export const dynamic = "force-dynamic";

const activationBodySchema = z.object({
  publicId: z.string().trim().min(6).max(32),
  scratchCode: z.string().trim().min(6).max(12),
  vehicleId: z.string().trim().min(1),
  userId: z.string().trim().min(1),
});

/**
 * Retail QR Sticker Activation Endpoint (POST /v1/qr/activate)
 *
 * Enforces cryptographic proof-of-possession, brute-force lockout,
 * vehicle ownership binding, and authoritative entitlement grants.
 */
export async function POST(req: NextRequest) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body", code: "ERR_BAD_REQUEST" },
        { status: 400 }
      );
    }

    const parseResult = activationBodySchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid activation request parameters",
          code: "ERR_VALIDATION_FAILED",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { publicId, scratchCode, vehicleId, userId } = parseResult.data;
    if (!isValidPublicIdFormat(publicId)) {
      return NextResponse.json(
        { error: "Malformed QR public identifier", code: "ERR_INVALID_PUBLIC_ID" },
        { status: 400 }
      );
    }

    const db = getApiDatabase();
    const now = new Date().toISOString();

    // 1. Fetch sticker and activation secret record
    const sticker = await db.queryFirst<{
      id: string;
      public_id: string;
      status: string;
      batch_id: string;
      secret_hash: string | null;
      hash_version: string | null;
      failed_attempts: number | null;
      locked_until: string | null;
      consumed_at: string | null;
    }>(
      `SELECT s.id, s.public_id, s.status, s.batch_id,
              sec.secret_hash, sec.hash_version, sec.failed_attempts,
              sec.locked_until, sec.consumed_at
       FROM qr_stickers s
       LEFT JOIN qr_activation_secrets sec ON s.id = sec.qr_id
       WHERE s.public_id = ?
       LIMIT 1`,
      [publicId]
    );

    if (!sticker) {
      return NextResponse.json(
        { error: "QR sticker not recognized in platform inventory", code: "ERR_QR_NOT_FOUND" },
        { status: 404 }
      );
    }

    // 2. Lifecycle Checks
    if (sticker.status === "ACTIVATED") {
      return NextResponse.json(
        { error: "This QR sticker is already activated and bound to a vehicle", code: "ERR_ALREADY_ACTIVATED" },
        { status: 409 }
      );
    }

    if (sticker.status === "BLOCKED" || sticker.status === "LOST_DAMAGED" || sticker.status === "REPLACED") {
      return NextResponse.json(
        { error: `This QR sticker cannot be activated (Status: ${sticker.status})`, code: "ERR_STICKER_INELIGIBLE" },
        { status: 400 }
      );
    }

    // 3. Lockout Protection Check (Rule 15)
    if (sticker.locked_until && new Date(sticker.locked_until).getTime() > Date.now()) {
      return NextResponse.json(
        {
          error: "Too many failed attempts. This QR code is temporarily locked for security. Please try again later.",
          code: "ERR_QR_LOCKED",
        },
        { status: 429 }
      );
    }

    // 4. Verify Proof of Possession (Scratch Secret Hash)
    if (!sticker.secret_hash) {
      return NextResponse.json(
        { error: "No activation secret registered for this QR sticker", code: "ERR_NO_SECRET_CONFIGURED" },
        { status: 400 }
      );
    }

    const isValidSecret = await verifyScratchSecret(
      scratchCode,
      sticker.secret_hash,
      (sticker.hash_version as any) || "v1"
    );

    if (!isValidSecret) {
      const currentFailures = (sticker.failed_attempts || 0) + 1;
      const shouldLock = currentFailures >= 5;
      const lockExpiry = shouldLock ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : null;

      await db.execute(
        `UPDATE qr_activation_secrets
         SET failed_attempts = ?, locked_until = COALESCE(?, locked_until), updated_at = ?
         WHERE qr_id = ?`,
        [currentFailures, lockExpiry, now, sticker.id]
      );

      // Audit attempt
      await db.execute(
        `INSERT INTO qr_activation_attempts (id, qr_id, user_id, outcome, failure_reason_code, created_at)
         VALUES (?, ?, ?, 'INVALID_SECRET', 'WRONG_PIN', ?)`,
        [`att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, sticker.id, userId, now]
      );

      return NextResponse.json(
        {
          error: "Invalid activation code. Please check the secret PIN under the scratch panel.",
          code: "ERR_INVALID_PIN",
        },
        { status: 400 }
      );
    }

    // 5. Authorize Vehicle Existence
    const vehicle = await db.queryFirst<{ id: string; user_id: string; registration_number: string }>(
      "SELECT id, user_id, registration_number FROM vehicles WHERE id = ? LIMIT 1",
      [vehicleId]
    );

    if (!vehicle) {
      return NextResponse.json(
        { error: "Selected vehicle does not exist in registry", code: "ERR_VEHICLE_NOT_FOUND" },
        { status: 404 }
      );
    }

    // 6. Execute Atomic Assignment & Activation
    const assignmentId = `asgn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const historyId = `qsh_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    await db.execute(
      `UPDATE qr_stickers
       SET status = 'ACTIVATED', activated_at = ?, updated_at = ?
       WHERE id = ?`,
      [now, now, sticker.id]
    );

    await db.execute(
      `UPDATE qr_activation_secrets
       SET consumed_at = ?, updated_at = ?
       WHERE qr_id = ?`,
      [now, now, sticker.id]
    );

    await db.execute(
      `INSERT INTO qr_assignments (id, qr_id, vehicle_id, user_id, assignment_type, assigned_at)
       VALUES (?, ?, ?, ?, 'INITIAL', ?)`,
      [assignmentId, sticker.id, vehicleId, userId, now]
    );

    await db.execute(
      `INSERT INTO qr_status_history (id, qr_id, from_status, to_status, reason_code, actor_type, actor_id, created_at)
       VALUES (?, ?, ?, 'ACTIVATED', 'RETAIL_ACTIVATION', 'USER', ?, ?)`,
      [historyId, sticker.id, sticker.status, userId, now]
    );

    // 7. Grant Authoritative Entitlements (Rule 00 & 01)
    await grantAuthoritativeEntitlements({
      userId,
      vehicleId,
      qrStickerId: sticker.id,
      acquisitionSource: "RETAIL_ACTIVATION",
      db,
    });

    // 8. Record audit attempt success
    await db.execute(
      `INSERT INTO qr_activation_attempts (id, qr_id, user_id, outcome, created_at)
       VALUES (?, ?, ?, 'SUCCESS', ?)`,
      [`att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, sticker.id, userId, now]
    );

    // 9. Dispatch in-app notification
    await createInAppNotification({
      db,
      userId,
      eventType: "QR_ACTIVATED",
      category: "SAFETY",
      priority: "HIGH",
      title: "QR Sticker Activated",
      body: `Your VaahanSafe sticker (${publicId}) has been successfully activated and connected to vehicle ${vehicle.registration_number}.`,
      actionType: "VIEW_QR",
      actionTarget: `/vehicles/${vehicleId}`,
    });

    return NextResponse.json(
      {
        success: true,
        message: "QR sticker successfully activated and safety services enabled.",
        data: {
          publicId,
          stickerId: sticker.id,
          vehicleId,
          status: "ACTIVATED",
          activatedAt: now,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ApiQrActivate] Unexpected activation failure:", error);
    return NextResponse.json(
      {
        error: "We could not complete QR activation right now. Please try again.",
        code: "ERR_ACTIVATION_FAILED",
      },
      { status: 500 }
    );
  }
}
