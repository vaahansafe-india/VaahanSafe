import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  generateQrPublicId,
  generateScratchSecret,
  hashScratchSecret,
} from "@vaahansafe/qr-core";
import { getApiDatabase } from "../../../_db";

export const dynamic = "force-dynamic";

const createBatchSchema = z.object({
  referenceCode: z.string().trim().min(3).max(50),
  quantity: z.number().int().min(1).max(500),
  manufacturerName: z.string().trim().optional(),
});

/**
 * Admin QR Batches Endpoint (GET/POST /v1/admin/qr/batches)
 *
 * GET: Lists manufacturing and print batches with current inventory status.
 * POST: Generates a new batch of physical QR stickers with cryptographically
 *       secure public IDs and one-way salted secret hashes.
 */
export async function GET(req: NextRequest) {
  try {
    const db = getApiDatabase();

    const batches = await db.query<{
      id: string;
      reference_code: string;
      quantity: number;
      status: string;
      manufacturer_name: string | null;
      created_at: string;
      total_stickers: number;
      activated_stickers: number;
    }>(
      `SELECT b.id, b.reference_code, b.quantity, b.status, b.manufacturer_name, b.created_at,
              COUNT(s.id) AS total_stickers,
              SUM(CASE WHEN s.status = 'ACTIVATED' THEN 1 ELSE 0 END) AS activated_stickers
       FROM qr_batches b
       LEFT JOIN qr_stickers s ON b.id = s.batch_id
       GROUP BY b.id
       ORDER BY b.created_at DESC`
    );

    return NextResponse.json(
      {
        success: true,
        batches: batches.map((b) => ({
          id: b.id,
          referenceCode: b.reference_code,
          quantity: b.quantity,
          status: b.status,
          manufacturerName: b.manufacturer_name,
          createdAt: b.created_at,
          totalStickers: Number(b.total_stickers) || 0,
          activatedStickers: Number(b.activated_stickers) || 0,
        })),
      },
      {
        status: 200,
        headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" },
      }
    );
  } catch (error) {
    console.error("[ApiAdminQrBatches GET] Query failed:", error);
    return NextResponse.json(
      { error: "Failed to retrieve QR batches", code: "ERR_BATCHES_FAILED" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const parseResult = createBatchSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid batch parameters",
          code: "ERR_VALIDATION_FAILED",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { referenceCode, quantity, manufacturerName } = parseResult.data;
    const db = getApiDatabase();
    const now = new Date().toISOString();
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // 1. Insert QR batch record
    await db.execute(
      `INSERT INTO qr_batches (id, reference_code, quantity, status, manufacturer_name, generated_at, created_at, updated_at)
       VALUES (?, ?, ?, 'GENERATED', ?, ?, ?, ?)`,
      [batchId, referenceCode, quantity, manufacturerName || "VaahanSafe Print Labs", now, now, now]
    );

    // 2. Generate stickers and hashed secrets
    const createdPublicIds: string[] = [];

    for (let i = 0; i < quantity; i++) {
      const publicId = generateQrPublicId();
      const stickerId = `qr_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`;
      const secretId = `sec_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`;
      const visibleCode = `VS-${publicId}`;

      const scratchPin = generateScratchSecret();
      const { secretHash, salt } = await hashScratchSecret(scratchPin);

      // Insert sticker record
      await db.execute(
        `INSERT INTO qr_stickers (id, public_id, visible_code, batch_id, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'PRINTED', ?, ?)`,
        [stickerId, publicId, visibleCode, batchId, now, now]
      );

      // Insert one-way secret hash (never plaintext PIN!)
      await db.execute(
        `INSERT INTO qr_activation_secrets (id, qr_id, secret_hash, hash_version, failed_attempts, created_at, updated_at)
         VALUES (?, ?, ?, 'v1', 0, ?, ?)`,
        [secretId, stickerId, secretHash, now, now]
      );

      createdPublicIds.push(publicId);
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully generated QR batch ${referenceCode} with ${quantity} stickers.`,
        data: {
          batchId,
          referenceCode,
          quantity,
          generatedAt: now,
          samplePublicId: createdPublicIds[0],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ApiAdminQrBatches POST] Batch generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate QR batch", code: "ERR_CREATE_BATCH_FAILED" },
      { status: 500 }
    );
  }
}
