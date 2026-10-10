import "server-only";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import type { AdminIdentity } from "../../../lib/contracts";
import type {
  BatchFilters,
  BatchItem,
  BatchPage,
  BatchSummary,
  BatchDetail,
  BatchStickerSample,
} from "../batches.types";
import { AdminError } from "../../../lib/session";

/**
 * Fetch authoritative summary strip aggregates in a single lightweight query
 */
export async function getBatchesSummary(
  _identity: AdminIdentity,
): Promise<BatchSummary> {
  const db = getSupabaseAdminClient();
  const { data, error } = await db.rpc("admin_get_batches_summary");
  if (error) {
    throw new AdminError(
      500,
      "SUMMARY_FAILED",
      "Failed to compute batches summary.",
    );
  }
  return {
    totalBatches: Number(data?.totalBatches || 0),
    totalIdentities: Number(data?.totalIdentities || 0),
    draft: Number(data?.draft || 0),
    generating: Number(data?.generating || 0),
    printReady: Number(data?.printReady || 0),
    printed: Number(data?.printed || 0),
    attention: Number(data?.attention || 0),
  };
}

function escapeSql(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * List batches using bounded query with lateral sticker aggregation
 */
export async function listBatches(
  _identity: AdminIdentity,
  filters: BatchFilters,
  cursor?: { createdAt: string; id: string } | null,
  limit = 25,
): Promise<BatchPage> {
  const db = getSupabaseAdminClient();
  const conditions: string[] = [];

  // Search filter (prefix / exact on reference or manufacturer)
  if (filters.q?.trim()) {
    const qEsc = escapeSql(filters.q.trim());
    conditions.push(
      `(b.reference_code ILIKE '%${qEsc}%' OR b.manufacturer_name ILIKE '%${qEsc}%')`,
    );
  }

  // Statuses
  if (filters.statuses?.length) {
    const statusList = filters.statuses
      .map((s) => `'${escapeSql(s)}'`)
      .join(", ");
    conditions.push(`b.status IN (${statusList})`);
  }

  // Channels
  if (filters.channels?.length) {
    const channelList = filters.channels
      .map((c) => `'${escapeSql(c)}'`)
      .join(", ");
    conditions.push(`b.inventory_channel IN (${channelList})`);
  }

  // Print state
  if (filters.print === "printed") {
    conditions.push(`b.printed_at IS NOT NULL`);
  } else if (filters.print === "not_printed") {
    conditions.push(`b.printed_at IS NULL`);
  } else if (filters.print === "print_ready") {
    conditions.push(`b.status = 'PRINT_READY'`);
  }

  // Date range
  if (filters.from) {
    conditions.push(`b.created_at >= '${escapeSql(filters.from)}'::timestamptz`);
  }
  if (filters.to) {
    conditions.push(`b.created_at <= ('${escapeSql(filters.to)}'::timestamptz + interval '1 day')`);
  }

  // Cursor pagination
  if (cursor) {
    const op = filters.sort === "oldest" ? ">" : "<";
    conditions.push(`(b.created_at, b.id) ${op} ('${escapeSql(cursor.createdAt)}'::timestamptz, '${escapeSql(cursor.id)}')`);
  }

  // Sorting
  let orderBy = "b.created_at DESC, b.id DESC";
  if (filters.sort === "oldest") {
    orderBy = "b.created_at ASC, b.id ASC";
  } else if (filters.sort === "quantity_desc") {
    orderBy = "b.quantity DESC, b.id DESC";
  } else if (filters.sort === "quantity_asc") {
    orderBy = "b.quantity ASC, b.id ASC";
  } else if (filters.sort === "recently_printed") {
    orderBy = "b.printed_at DESC NULLS LAST, b.created_at DESC, b.id DESC";
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const fetchLimit = Math.min(Math.max(limit, 1), 100);

  const querySql = `
    SELECT
      b.id,
      b.reference_code AS reference,
      b.inventory_channel AS channel,
      b.quantity,
      b.status,
      b.manufacturer_name AS "manufacturerName",
      b.created_at AS "createdAt",
      b.generated_at AS "generatedAt",
      b.printed_at AS "printedAt",
      b.updated_at AS "updatedAt",
      b.notes,
      b.created_by AS "createdBy",
      u.email AS "creatorEmail",
      coalesce(s.gen_count, 0)::int AS "generatedCount",
      coalesce(s.val_count, 0)::int AS "validatedCount",
      coalesce(s.print_count, 0)::int AS "printedCount",
      exp.id AS "activationExportId"
    FROM qr_batches b
    LEFT JOIN admin_users u ON u.id = b.created_by
    LEFT JOIN qr_batch_activation_exports exp ON exp.batch_id = b.id
    LEFT JOIN LATERAL (
      SELECT
        count(*)::int AS gen_count,
        count(activation_secret_hash)::int AS val_count,
        count(*) FILTER (WHERE status = 'PRINTED')::int AS print_count
      FROM qr_stickers qs
      WHERE qs.batch_id = b.id
    ) s ON true
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ${fetchLimit + 1};
  `;

  const countSql = `SELECT count(*)::int as total FROM qr_batches b ${whereClause};`;

  let rawRows: any[] = [];
  try {
    const res = await db.rpc("exec_sql", { p_sql: querySql });
    const resData = res?.data ?? res;
    if (Array.isArray(resData)) {
      rawRows = resData;
    }
  } catch (err) {
    console.error("listBatches exec_sql error:", err);
  }

  let totalMatching = rawRows.length;
  try {
    const countRes = await db.rpc("exec_sql", { p_sql: countSql });
    const countData = countRes?.data ?? countRes;
    if (Array.isArray(countData) && countData[0]?.total != null) {
      totalMatching = Number(countData[0].total);
    }
  } catch (err) {
    console.error("countSql error:", err);
  }

  const hasMore = rawRows.length > fetchLimit;
  const slicedRows = hasMore ? rawRows.slice(0, fetchLimit) : rawRows;

  const rows: BatchItem[] = slicedRows.map((r: any) => ({
    id: r.id,
    reference: r.reference || r.reference_code,
    channel: r.channel || r.inventory_channel,
    quantity: Number(r.quantity),
    status: r.status,
    manufacturerName: r.manufacturerName || r.manufacturer_name,
    createdAt: r.createdAt || r.created_at,
    updatedAt: r.updatedAt || r.updated_at,
    generatedAt: r.generatedAt || r.generated_at,
    printedAt: r.printedAt || r.printed_at,
    notes: r.notes || null,
    createdBy: r.createdBy || r.created_by,
    creatorEmail: r.creatorEmail || null,
    generatedCount: Number(r.generatedCount ?? 0),
    validatedCount: Number(r.validatedCount ?? 0),
    printedCount: Number(r.printedCount ?? 0),
    activationExportId: r.activationExportId || null,
  }));

  const lastRow = rows[rows.length - 1];
  const nextCursor = hasMore && lastRow ? `${lastRow.createdAt}|${lastRow.id}` : null;

  return {
    rows,
    nextCursor,
    totalMatching,
  };
}

/**
 * Fetch detailed manufacturing view of a single batch
 */
export async function getBatchDetail(
  _identity: AdminIdentity,
  batchId: string,
): Promise<BatchDetail> {
  const db = getSupabaseAdminClient();

  const { data: batch, error: batchError } = await db
    .from("qr_batches")
    .select(`
      id,
      reference_code,
      inventory_channel,
      quantity,
      status,
      manufacturer_name,
      created_at,
      updated_at,
      generated_at,
      printed_at,
      notes,
      created_by
    `)
    .eq("id", batchId)
    .maybeSingle();

  if (batchError || !batch) {
    throw new AdminError(404, "BATCH_NOT_FOUND", "Batch not found.");
  }

  // Concurrent subqueries for detailed manufacturing overview
  const [stickersRes, exportRes, auditRes, printRes] = await Promise.all([
    // Up to 20 representative sticker records
    db
      .from("qr_stickers")
      .select("id, public_id, visible_code, status, lifecycle_state, activation_secret_hash, created_at")
      .eq("batch_id", batchId)
      .order("created_at", { ascending: false })
      .limit(20),

    // Activation export record (if provisioned)
    db
      .from("qr_batch_activation_exports")
      .select("id, code_count, created_at, object_key, ciphertext_sha256")
      .eq("batch_id", batchId)
      .maybeSingle(),

    // Audit logs for this batch
    db
      .from("admin_audit_logs")
      .select("id, action, reason, created_at, actor_id, after_summary")
      .eq("resource_type", "batches")
      .eq("resource_id", batchId)
      .order("created_at", { ascending: false })
      .limit(20),

    // Print jobs for this batch
    db
      .from("qr_print_jobs")
      .select("id, reference, status, mode, quantity, created_at")
      .eq("batch_id", batchId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const stickers = stickersRes.data || [];
  let generatedCount = stickers.length;
  let validatedCount = stickers.filter((s) => s.activation_secret_hash).length;
  let printedCount = stickers.filter((s) => s.status === "PRINTED").length;

  try {
    const statsRes = await db.rpc("exec_sql", {
      p_sql: `
        SELECT
          count(*)::int AS gen_count,
          count(activation_secret_hash)::int AS val_count,
          count(*) FILTER (WHERE status = 'PRINTED')::int AS print_count
        FROM qr_stickers
        WHERE batch_id = '${escapeSql(batchId)}';
      `,
    });
    const statsData = statsRes?.data ?? statsRes;
    if (Array.isArray(statsData) && statsData[0]) {
      generatedCount = Number(statsData[0].gen_count || 0);
      validatedCount = Number(statsData[0].val_count || 0);
      printedCount = Number(statsData[0].print_count || 0);
    }
  } catch (err) {
    console.error("getBatchDetail stats query error:", err);
  }

  const stickersSample: BatchStickerSample[] = stickers.map((s) => ({
    id: s.id,
    publicId: s.public_id,
    visibleCode: s.visible_code,
    status: s.status,
    lifecycleState: s.lifecycle_state,
    hasSecret: !!s.activation_secret_hash,
    createdAt: s.created_at,
  }));

  const item: BatchItem = {
    id: batch.id,
    reference: batch.reference_code,
    channel: batch.inventory_channel as any,
    quantity: batch.quantity,
    status: batch.status as any,
    manufacturerName: batch.manufacturer_name,
    createdAt: batch.created_at,
    updatedAt: batch.updated_at,
    generatedAt: batch.generated_at,
    printedAt: batch.printed_at,
    notes: batch.notes,
    createdBy: batch.created_by,
    creatorEmail: null,
    generatedCount,
    validatedCount,
    printedCount,
    activationExportId: exportRes.data?.id || null,
  };

  // Derive allowed next actions server-authoritatively
  const st = item.status;
  const allowedNextActions: string[] = [];
  if (st === "DRAFT") {
    allowedNextActions.push("GENERATE_IDENTITIES", "VOID_BATCH");
  } else if (st === "GENERATED") {
    allowedNextActions.push("VALIDATE_BATCH", "VOID_BATCH");
  } else if (st === "VALIDATED") {
    allowedNextActions.push("APPROVE_PRINT", "VOID_BATCH");
  } else if (st === "PRINT_READY") {
    allowedNextActions.push("MARK_PRINTED", "VOID_BATCH");
  } else if (st === "PRINTED") {
    allowedNextActions.push("RECEIVE_BATCH", "QUARANTINE_BATCH");
  } else if (st === "RECEIVED") {
    allowedNextActions.push("CLOSE_BATCH", "QUARANTINE_BATCH");
  }

  return {
    batch: item,
    stickersSample,
    activationExport: exportRes.data
      ? {
          id: exportRes.data.id,
          codeCount: exportRes.data.code_count,
          createdAt: exportRes.data.created_at,
          objectKey: exportRes.data.object_key,
          ciphertextSha256: exportRes.data.ciphertext_sha256,
        }
      : null,
    auditLogs: (auditRes.data || []).map((a) => ({
      id: a.id,
      action: a.action,
      reason: a.reason,
      createdAt: a.created_at,
      actorEmail: a.actor_id,
      afterSummary: (a.after_summary as Record<string, unknown>) || undefined,
    })),
    printJobs: (printRes.data || []).map((p) => ({
      id: p.id,
      reference: p.reference,
      status: p.status,
      mode: p.mode,
      quantity: p.quantity,
      createdAt: p.created_at,
    })),
    allowedNextActions,
    canGenerate: st === "DRAFT",
    canValidate: st === "DRAFT" || st === "GENERATED",
    canApprovePrint: st === "VALIDATED",
    canMarkPrinted: st === "PRINT_READY",
    canReceive: st === "PRINTED",
    canVoid: !["CLOSED", "VOIDED"].includes(st),
  };
}
