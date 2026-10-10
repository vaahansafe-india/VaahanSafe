import "server-only";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import { generateQrPublicId, formatVisibleCode } from "@vaahansafe/qr-core";
import type { AdminIdentity } from "../../../lib/contracts";
import type { CreateBatchInput, BatchStatus } from "../batches.types";
import { AdminError } from "../../../lib/session";

/**
 * Create a new controlled manufacturing batch lot
 */
export async function createBatch(
  identity: AdminIdentity,
  input: CreateBatchInput,
) {
  if (!["SUPER_ADMIN", "OPS_ADMIN"].includes(identity.role)) {
    throw new AdminError(403, "FORBIDDEN", "Your role cannot create batches.");
  }

  const db = getSupabaseAdminClient();
  const requestId = crypto.randomUUID();

  const { data, error } = await db.rpc("admin_create_batch", {
    p_session: identity.sessionId,
    p_reference: input.reference,
    p_channel: input.channel,
    p_quantity: input.quantity,
    p_manufacturer: input.manufacturerName || null,
    p_notes: input.notes || null,
    p_request: requestId,
  });

  if (error) {
    if (error.message?.includes("DUPLICATE_REFERENCE")) {
      throw new AdminError(
        409,
        "DUPLICATE_REFERENCE",
        `Batch reference "${input.reference}" already exists.`,
      );
    }
    throw new AdminError(400, "CREATE_FAILED", error.message || "Could not create batch.");
  }

  return data;
}

/**
 * Transition batch lifecycle status with authoritative state machine rules
 */
export async function transitionBatchStatus(
  identity: AdminIdentity,
  batchId: string,
  toStatus: BatchStatus,
  reason?: string,
) {
  if (!["SUPER_ADMIN", "OPS_ADMIN"].includes(identity.role)) {
    throw new AdminError(403, "FORBIDDEN", "Your role cannot transition batch status.");
  }

  const db = getSupabaseAdminClient();
  const requestId = crypto.randomUUID();

  const { data, error } = await db.rpc("admin_transition_batch_status", {
    p_session: identity.sessionId,
    p_batch: batchId,
    p_to_status: toStatus,
    p_reason: reason || "Manual state transition by operations admin",
    p_request: requestId,
  });

  if (error) {
    if (error.message?.includes("INVALID_TRANSITION")) {
      throw new AdminError(
        400,
        "INVALID_TRANSITION",
        `This batch cannot transition to "${toStatus}" from its current state.`,
      );
    }
    throw new AdminError(400, "TRANSITION_FAILED", error.message || "Failed to transition batch.");
  }

  return data;
}

/**
 * Generate cryptographic QR identities in chunks for a batch
 */
export async function generateBatchIdentities(
  identity: AdminIdentity,
  batchId: string,
) {
  if (!["SUPER_ADMIN", "OPS_ADMIN"].includes(identity.role)) {
    throw new AdminError(403, "FORBIDDEN", "Your role cannot generate batch identities.");
  }

  const db = getSupabaseAdminClient();

  const { data: batch, error: batchErr } = await db
    .from("qr_batches")
    .select("id, reference_code, quantity, status, inventory_channel")
    .eq("id", batchId)
    .maybeSingle();

  if (batchErr || !batch) {
    throw new AdminError(404, "BATCH_NOT_FOUND", "Batch not found.");
  }

  if (batch.status !== "DRAFT") {
    throw new AdminError(
      400,
      "BATCH_NOT_DRAFT",
      `Batch is currently in status "${batch.status}". Only DRAFT batches can generate identities.`,
    );
  }

  // Count existing stickers
  const { count: existingCount, error: countErr } = await db
    .from("qr_stickers")
    .select("id", { count: "exact", head: true })
    .eq("batch_id", batchId);

  if (countErr) throw countErr;
  const targetQuantity = batch.quantity;
  const remaining = targetQuantity - (existingCount || 0);

  if (remaining <= 0) {
    // All stickers already created; transition batch status to GENERATED
    await db
      .from("qr_batches")
      .update({ status: "GENERATED", generated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", batchId);
    return { batchId, generated: 0, total: existingCount };
  }

  // Generate in chunks of up to 500 records
  const chunkSize = 500;
  const toGenerate = Math.min(remaining, 5000); // Guard max per single request
  let generatedThisRun = 0;

  for (let offset = 0; offset < toGenerate; offset += chunkSize) {
    const currentChunkSize = Math.min(chunkSize, toGenerate - offset);
    const chunkRows: {
      id: string;
      public_id: string;
      public_code: string;
      visible_code: string;
      batch_id: string;
      status: string;
      lifecycle_state: string;
      qr_type: string;
      created_at: string;
    }[] = [];

    const now = new Date().toISOString();
    for (let i = 0; i < currentChunkSize; i++) {
      const publicId = generateQrPublicId();
      const visibleCode = formatVisibleCode(publicId);
      chunkRows.push({
        id: `qr_${crypto.randomUUID()}`,
        public_id: publicId,
        public_code: visibleCode,
        visible_code: visibleCode,
        batch_id: batchId,
        status: "INVENTORY",
        lifecycle_state: "INVENTORY",
        qr_type: "PHYSICAL_STICKER",
        created_at: now,
      });
    }

    const { error: insertErr } = await db.from("qr_stickers").insert(chunkRows);
    if (insertErr) {
      throw new AdminError(
        500,
        "GENERATION_INSERT_FAILED",
        `Failed inserting identity chunk: ${insertErr.message}`,
      );
    }
    generatedThisRun += currentChunkSize;
  }

  const finalTotal = (existingCount || 0) + generatedThisRun;
  const isComplete = finalTotal >= targetQuantity;

  if (isComplete) {
    await db
      .from("qr_batches")
      .update({
        status: "GENERATED",
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", batchId);
  }

  // Audit event
  await db.from("admin_audit_logs").insert({
    actor_id: identity.id,
    action: "GENERATE_BATCH_IDENTITIES",
    resource_type: "batches",
    resource_id: batchId,
    reason: `Generated ${generatedThisRun} cryptographic QR identities for ${batch.reference_code}.`,
    request_id: crypto.randomUUID(),
    after_summary: {
      batchId,
      reference: batch.reference_code,
      generated: generatedThisRun,
      totalGenerated: finalTotal,
      targetQuantity,
      complete: isComplete,
    },
  });

  return {
    batchId,
    generated: generatedThisRun,
    total: finalTotal,
    complete: isComplete,
  };
}

/**
 * Void or Quarantine a batch
 */
export async function voidBatch(
  identity: AdminIdentity,
  batchId: string,
  reason: string,
  mode: "VOIDED" | "QUARANTINED" = "VOIDED",
) {
  return transitionBatchStatus(identity, batchId, mode, reason);
}
