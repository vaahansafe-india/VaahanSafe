import "server-only";
import {
  getSupabaseAdminClient,
  getAuthoritativeDatabaseClient,
} from "@vaahansafe/database";
import { CloudflareR2RestClient } from "@vaahansafe/storage";
import {
  decryptActivationManifest,
  encryptActivationManifest,
  verifyScratchSecret,
} from "@vaahansafe/qr-core";
import type { AdminIdentity } from "../../../lib/contracts";
import { AdminError } from "../../../lib/session";
import type {
  PrintJob,
  StickerTemplate,
  InventorySelection,
} from "../inventory.types";
import { canPrintInventory } from "../inventory.permissions";
import { inventoryRpc, validateSelection } from "./read-inventory";
import { buildStickerScene } from "../print/sticker-render-model";
import { renderStickerPdf } from "../print/sticker-pdf";

const digest = async (text: string) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
    ),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
function assertPrint(identity: AdminIdentity) {
  if (!canPrintInventory(identity.role))
    throw new AdminError(
      403,
      "FORBIDDEN",
      "Your role cannot create production print jobs.",
    );
  if (
    !identity.stepUpAt ||
    Date.now() - Date.parse(identity.stepUpAt) > 10 * 60 * 1000
  )
    throw new AdminError(
      403,
      "STEP_UP_REQUIRED",
      "Verify a fresh email OTP before this action.",
    );
}
export async function createPrintJob(
  identity: AdminIdentity,
  input: {
    selection: InventorySelection;
    mode: string;
    reason: string;
    requestId: string;
  },
) {
  assertPrint(identity);
  if (
    !["PRINT", "REPRINT"].includes(input.mode) ||
    typeof input.reason !== "string" ||
    !/^[a-f0-9-]{36}$/.test(input.requestId || "")
  )
    throw new AdminError(
      400,
      "INVALID_REQUEST",
      "Review the production print request.",
    );
  return inventoryRpc(identity, "admin_inventory_create_print_job", {
    p_selection: validateSelection(input.selection),
    p_mode: input.mode,
    p_reason: input.reason,
    p_request: input.requestId,
  });
}
type StoredJob = PrintJob & {
  actorId: string;
  template: StickerTemplate;
  objectKey: string | null;
  checksum: string | null;
};
async function storedJob(
  identity: AdminIdentity,
  id: string,
): Promise<StoredJob> {
  assertPrint(identity);
  if (!/^[a-f0-9-]{36}$/.test(id))
    throw new AdminError(404, "NOT_FOUND", "This print job is unavailable.");
  const db = getAuthoritativeDatabaseClient();
  const job = await db.queryFirst<StoredJob>(
    `SELECT id,reference_code AS reference,mode,status,quantity,created_at AS "createdAt",expires_at AS "expiresAt",reason,actor_id AS "actorId",template_snapshot AS template,object_key AS "objectKey",ciphertext_sha256 AS checksum FROM qr_print_jobs WHERE id=? AND actor_id=?`,
    [id, identity.id],
  );
  if (!job)
    throw new AdminError(404, "NOT_FOUND", "This print job is unavailable.");
  if (job.mode === "REPRINT" && identity.role !== "SUPER_ADMIN")
    throw new AdminError(
      403,
      "FORBIDDEN",
      "Only a super administrator can authorize reprints.",
    );
  return job;
}
export async function printJobMetadata(identity: AdminIdentity, id: string) {
  const job = await storedJob(identity, id);
  const { data: items, error } = await getSupabaseAdminClient()
    .from("qr_print_items")
    .select("sequence,qr:qr_stickers!inner(visible_code)")
    .eq("job_id", id)
    .order("sequence");
  if (error) throw error;
  const {
    actorId: _actor,
    objectKey: _object,
    checksum: _checksum,
    ...safe
  } = job;
  return { ...safe, items: items || [] };
}
function encryptionConfig() {
  const key = process.env.ACTIVATION_EXPORT_ENCRYPTION_KEY_V1 || "",
    bucket = process.env.QR_ACTIVATION_EXPORT_BUCKET || "";
  if (!/^[a-f0-9]{64}$/.test(key) || !bucket)
    throw new AdminError(
      503,
      "PRINT_UNAVAILABLE",
      "Secure print storage is unavailable. Please try again.",
    );
  return {
    key,
    bucket,
    store: new CloudflareR2RestClient({ bucketName: bucket }),
  };
}
export async function generatePrintArtifact(
  identity: AdminIdentity,
  id: string,
) {
  const job = await storedJob(identity, id);
  await inventoryRpc(identity, "admin_inventory_advance_print_job", {
    p_job: id,
    p_action: "GENERATE",
  });
  try {
    const { key, bucket, store } = encryptionConfig(),
      db = getAuthoritativeDatabaseClient();
    const rows = await db.query<{
      id: string;
      publicId: string;
      visibleCode: string;
      batchId: string;
      hash: string;
      hashVersion: string;
      sequence: number;
    }>(
      `SELECT s.id,s.public_id AS "publicId",s.visible_code AS "visibleCode",s.batch_id AS "batchId",sec.secret_hash AS hash,sec.hash_version AS "hashVersion",i.sequence FROM qr_print_items i JOIN qr_stickers s ON s.id=i.qr_id JOIN qr_activation_secrets sec ON sec.qr_id=s.id WHERE i.job_id=? AND s.status IN ('INVENTORY','PRINTED') AND sec.consumed_at IS NULL ORDER BY i.sequence`,
      [id],
    );
    if (rows.length !== job.quantity)
      throw new Error("Print inventory changed");
    const batchIds = [...new Set(rows.map((r) => r.batchId))];
    const { data: archives, error } = await getSupabaseAdminClient()
      .from("qr_batch_activation_exports")
      .select("batch_id,bucket_name,object_key,ciphertext_sha256")
      .in("batch_id", batchIds);
    if (error || archives?.length !== batchIds.length)
      throw new Error("Recovery archive unavailable");
    const material = new Map<
      string,
      { publicId: string; vaahanSafeId: string; activationCode: string }
    >();
    for (const archive of archives) {
      if (archive.bucket_name !== bucket)
        throw new Error("Unapproved print storage");
      const object = await store.get(archive.object_key);
      if (!object) throw new Error("Recovery archive unavailable");
      const encrypted = new TextDecoder().decode(
        await new Response(object.data).arrayBuffer(),
      );
      if ((await digest(encrypted)) !== archive.ciphertext_sha256)
        throw new Error("Recovery archive integrity mismatch");
      const manifest = JSON.parse(
        await decryptActivationManifest(encrypted, key, archive.batch_id),
      );
      for (const entry of manifest.entries)
        if (rows.some((row) => row.id === entry.qrId))
          material.set(entry.qrId, entry);
    }
    const scenes = [];
    for (const row of rows) {
      const entry = material.get(row.id);
      if (
        !entry ||
        entry.publicId !== row.publicId ||
        entry.vaahanSafeId !== row.visibleCode ||
        !(await verifyScratchSecret(
          entry.activationCode,
          row.hash,
          row.hashVersion,
        ))
      )
        throw new Error("Print credential integrity mismatch");
      scenes.push(
        buildStickerScene(
          job.template,
          row.publicId,
          row.visibleCode,
          entry.activationCode,
        ),
      );
    }
    const pdf = renderStickerPdf(scenes),
      objectKey = `print-jobs/${id}/sticker.pdf.enc`;
    const encrypted = await encryptActivationManifest(
      Buffer.from(pdf).toString("base64"),
      key,
      `print-job:${id}`,
    );
    await store.put(objectKey, new TextEncoder().encode(encrypted), {
      contentType: "application/octet-stream",
    });
    const readback = await store.get(objectKey);
    if (!readback) throw new Error("Print artifact unavailable");
    const recovered = new TextDecoder().decode(
      await new Response(readback.data).arrayBuffer(),
    );
    if (recovered !== encrypted)
      throw new Error("Print artifact integrity mismatch");
    await inventoryRpc(identity, "admin_inventory_advance_print_job", {
      p_job: id,
      p_action: "STORE",
      p_object: objectKey,
      p_checksum: await digest(encrypted),
    });
    return { id, status: "READY_TO_PRINT" };
  } catch (error) {
    try {
      await inventoryRpc(identity, "admin_inventory_advance_print_job", {
        p_job: id,
        p_action: "FAIL",
      });
    } catch {
      /* Preserve uncertain state; never claim successful output. */
    }
    throw error;
  }
}
export async function issuePrintArtifact(identity: AdminIdentity, id: string) {
  const job = await storedJob(identity, id);
  if (
    !job.objectKey ||
    !job.checksum ||
    !["READY_TO_PRINT", "PRINTING"].includes(job.status)
  )
    throw new AdminError(
      409,
      "NOT_READY",
      "Prepare this print file before opening it.",
    );
  if (Date.parse(job.expiresAt) <= Date.now())
    throw new AdminError(
      410,
      "JOB_EXPIRED",
      "This print artifact has expired. Resolve the job before requesting another.",
    );
  const { key, store } = encryptionConfig(),
    object = await store.get(job.objectKey);
  if (!object) throw new Error("Print artifact unavailable");
  const encrypted = new TextDecoder().decode(
    await new Response(object.data).arrayBuffer(),
  );
  if ((await digest(encrypted)) !== job.checksum)
    throw new Error("Print artifact integrity mismatch");
  const pdf = Buffer.from(
    await decryptActivationManifest(encrypted, key, `print-job:${id}`),
    "base64",
  );
  // Recheck the authoritative session, expiry and lifecycle immediately before issuance.
  await inventoryRpc(identity, "admin_inventory_advance_print_job", {
    p_job: id,
    p_action: "ISSUE",
  });
  return { pdf, reference: job.reference };
}
export async function finishPrintJob(
  identity: AdminIdentity,
  id: string,
  action: string,
  reason: string,
) {
  await storedJob(identity, id);
  return inventoryRpc(identity, "admin_inventory_finish_print_job", {
    p_job: id,
    p_action: action,
    p_reason: reason,
  });
}
