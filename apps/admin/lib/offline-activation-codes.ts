import "server-only";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import { CloudflareR2RestClient } from "@vaahansafe/storage";
import {
  generateScratchSecret,
  hashScratchSecret,
  verifyScratchSecret,
  encryptActivationManifest,
  decryptActivationManifest,
} from "@vaahansafe/qr-core";
import { AdminError } from "./session";
import type { AdminIdentity } from "./contracts";

export async function provisionOfflineActivationCodes(
  identity: AdminIdentity,
  batchId: string,
) {
  const db = getSupabaseAdminClient();
  const { data: batch, error: batchError } = await db
    .from("qr_batches")
    .select("id,reference_code,quantity,inventory_channel")
    .eq("id", batchId)
    .maybeSingle();
  if (batchError) throw batchError;
  if (!batch || batch.inventory_channel !== "OFFLINE_RETAIL")
    throw new AdminError(
      400,
      "INVALID_BATCH",
      "Choose an imported offline batch.",
    );
  const { data: existing, error: exportError } = await db
    .from("qr_batch_activation_exports")
    .select("id,code_count")
    .eq("batch_id", batchId)
    .maybeSingle();
  if (exportError) throw exportError;
  if (existing)
    return {
      exportId: existing.id,
      count: existing.code_count,
      alreadyProvisioned: true,
      reference: batch.reference_code,
    };
  const key = process.env.ACTIVATION_EXPORT_ENCRYPTION_KEY_V1 || "";
  const bucket = process.env.QR_ACTIVATION_EXPORT_BUCKET || "";
  if (!/^[a-f0-9]{64}$/.test(key) || !bucket)
    throw new AdminError(
      503,
      "EXPORT_UNAVAILABLE",
      "Private activation-code storage is not configured.",
    );
  // Verify privacy immediately before writing credentials; never use a public bucket.
  const account = process.env.CLOUDFLARE_ACCOUNT_ID,
    token = process.env.CLOUDFLARE_API_TOKEN;
  for (const path of ["managed", "custom"]) {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${account}/r2/buckets/${bucket}/domains/${path}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!response.ok)
      throw new Error("Private export storage verification unavailable");
    const info = await response.json();
    if (
      !info.success ||
      (path === "managed"
        ? info.result.enabled !== false
        : !Array.isArray(info.result.domains) || info.result.domains.length > 0)
    )
      throw new Error("Activation-code export storage must be private");
  }
  const { data: stickers, error: inventoryError } = await db
    .from("qr_stickers")
    .select(
      "id,public_id,visible_code,status,lifecycle_state,user_id,vehicle_id,activated_at,activation_secret_hash",
    )
    .eq("batch_id", batchId)
    .order("id")
    .range(0, 4999);
  if (inventoryError) throw inventoryError;
  if (
    !stickers ||
    stickers.length !== batch.quantity ||
    stickers.some(
      (s) =>
        s.status !== "INVENTORY" ||
        s.lifecycle_state !== "INVENTORY" ||
        s.user_id ||
        s.vehicle_id ||
        s.activated_at ||
        s.activation_secret_hash,
    )
  )
    throw new AdminError(
      409,
      "BATCH_CHANGED",
      "This batch is already configured or its inventory has changed. Refresh its records.",
    );
  const { data: history, error: historyError } = await db
    .from("qr_status_history")
    .select("qr_id,metadata_json,sticker:qr_stickers!inner(batch_id)")
    .eq("reason_code", "OFFLINE_BATCH_IMPORT")
    .eq("sticker.batch_id", batchId)
    .range(0, 4999);
  if (historyError) throw historyError;
  const serials = new Map(
    (history || []).map((h) => [
      h.qr_id,
      JSON.parse(h.metadata_json || "{}").serial,
    ]),
  );
  const codes = new Set<string>();
  const entries: {
    qrId: string;
    serial: string;
    publicId: string;
    vaahanSafeId: string;
    activationCode: string;
  }[] = [];
  const hashes: { qrId: string; hash: string; version: string }[] = [];
  for (const sticker of stickers) {
    const serial = serials.get(sticker.id);
    if (typeof serial !== "string" || !/^B[0-9]{3}-[0-9]{4}$/.test(serial))
      throw new Error("Offline inventory provenance missing");
    let code = generateScratchSecret(16);
    while (codes.has(code)) code = generateScratchSecret(16);
    codes.add(code);
    const { secretHash, hashVersion } = await hashScratchSecret(code);
    if (!(await verifyScratchSecret(code, secretHash, hashVersion)))
      throw new Error("Activation proof verification failed");
    entries.push({
      qrId: sticker.id,
      serial,
      publicId: sticker.public_id,
      vaahanSafeId: sticker.visible_code,
      activationCode: code,
    });
    hashes.push({ qrId: sticker.id, hash: secretHash, version: hashVersion });
  }
  const exportId = crypto.randomUUID(),
    objectKey = `activation-codes/${batchId}/${exportId}.json.enc`;
  const plaintext = JSON.stringify({
    version: 1,
    batch: batch.reference_code,
    createdAt: new Date().toISOString(),
    entries: entries.sort((a, b) => a.serial.localeCompare(b.serial)),
  });
  const encrypted = await encryptActivationManifest(plaintext, key, batchId);
  const store = new CloudflareR2RestClient({ bucketName: bucket });
  await store.put(objectKey, new TextEncoder().encode(encrypted), {
    contentType: "application/octet-stream",
  });
  const recovered = await store.get(objectKey);
  if (!recovered)
    throw new Error("Private packaging export verification failed");
  const stored = new TextDecoder().decode(
    await new Response(recovered.data).arrayBuffer(),
  );
  if ((await decryptActivationManifest(stored, key, batchId)) !== plaintext)
    throw new Error("Private packaging export verification failed");
  const checksum = Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(stored)),
    ),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
  const { data: result, error: provisioningError } = await db.rpc(
    "admin_provision_offline_activation_codes",
    {
      p_session: identity.sessionId,
      p_batch: batchId,
      p_hashes: hashes,
      p_export: exportId,
      p_bucket: bucket,
      p_object: objectKey,
      p_checksum: checksum,
      p_request: crypto.randomUUID(),
    },
  );
  // If a request is interrupted, keep its encrypted archive. A retry checks the
  // committed metadata first and never replaces already-issued activation codes.
  if (provisioningError?.message?.includes("BATCH_CHANGED"))
    throw new AdminError(
      409,
      "BATCH_CHANGED",
      "This batch changed during setup. Refresh its records.",
    );
  if (provisioningError) throw provisioningError;
  return { ...result, reference: batch.reference_code };
}
