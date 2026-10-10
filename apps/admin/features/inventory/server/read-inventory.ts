import "server-only";
import {
  getSupabaseAdminClient,
  getAuthoritativeDatabaseClient,
} from "@vaahansafe/database";
import { AdminError } from "../../../lib/session";
import type { AdminIdentity } from "../../../lib/contracts";
import type {
  InventoryFilters,
  InventoryPage,
  InventoryRow,
  InventoryFacets,
  InventorySelection,
  InventoryDetail,
  StickerTemplate,
} from "../inventory.types";
import {
  encodeInventoryCursor,
  decodeInventoryCursor,
} from "../inventory.filters";
import {
  canReadInventory,
  getPrintEligibility,
} from "../inventory.permissions";
import {
  buildStickerScene,
  renderStickerSvg,
} from "../print/sticker-render-model";
import { parseInventorySelection } from "../inventory.selection";

export async function inventoryRpc(
  identity: AdminIdentity,
  name: string,
  args: Record<string, unknown> = {},
) {
  if (!canReadInventory(identity.role))
    throw new AdminError(403, "FORBIDDEN", "Your role cannot view inventory.");
  const { data, error } = await getSupabaseAdminClient().rpc(name, {
    p_session: identity.sessionId,
    ...args,
  });
  if (error) {
    if (/JOB_EXPIRED/.test(error.message))
      throw new AdminError(
        410,
        "JOB_EXPIRED",
        "This print artifact has expired. Resolve the job before requesting another.",
      );
    if (
      /JOB_CHANGED|JOB_UNAVAILABLE|JOB_FINISHED|PRINT_NOT_STARTED/.test(
        error.message,
      )
    )
      throw new AdminError(
        409,
        "JOB_CHANGED",
        "This print job is unavailable or has changed. Refresh its record.",
      );
    if (/REASON_REQUIRED|INVALID_PRINT_REQUEST/.test(error.message))
      throw new AdminError(
        400,
        "REASON_REQUIRED",
        "Provide an operational reason between 10 and 500 characters.",
      );
    if (/SELECTION_LIMIT/.test(error.message))
      throw new AdminError(
        400,
        "SELECTION_LIMIT",
        "Select between 1 and 100 identities for this action. Narrow your filters or select individual rows.",
      );
    if (/SELECTION_EXPIRED/.test(error.message))
      throw new AdminError(
        409,
        "SELECTION_EXPIRED",
        "Your selection has expired. Select the matching inventory again.",
      );
    if (/PRINT_INELIGIBLE|INVENTORY_CHANGED/.test(error.message))
      throw new AdminError(
        409,
        "PRINT_INELIGIBLE",
        "Some selected identities are no longer eligible. Refresh and review them before printing.",
      );
    if (/REPRINT_FORBIDDEN/.test(error.message))
      throw new AdminError(
        403,
        "FORBIDDEN",
        "Only a super administrator can authorize reprints.",
      );
    throw new AdminError(
      503,
      "INVENTORY_UNAVAILABLE",
      "We couldn't load or update inventory right now. Please try again.",
    );
  }
  return data;
}
export async function listInventory(
  identity: AdminIdentity,
  filters: InventoryFilters,
  cursor: string | null = null,
): Promise<InventoryPage> {
  let parsed;
  try {
    parsed = decodeInventoryCursor(cursor);
  } catch {
    throw new AdminError(
      400,
      "INVALID_CURSOR",
      "Refresh inventory to restart this result list.",
    );
  }
  const rows = (await inventoryRpc(identity, "admin_inventory_list", {
    p_filters: filters,
    p_cursor: parsed,
  })) as InventoryRow[];
  const visible = rows.slice(0, 50),
    last = visible.at(-1);
  return {
    rows: visible,
    nextCursor:
      rows.length > 50 && last
        ? encodeInventoryCursor({ createdAt: last.createdAt, id: last.id })
        : null,
  };
}
export async function inventoryFacets(
  identity: AdminIdentity,
  filters: InventoryFilters,
): Promise<InventoryFacets> {
  return inventoryRpc(identity, "admin_inventory_facets", {
    p_filters: filters,
  });
}
export async function resolveSelection(
  identity: AdminIdentity,
  selection: InventorySelection,
) {
  return inventoryRpc(identity, "inventory_selected_ids", {
    p_selection: validateSelection(selection),
    p_limit: 100,
  }) as Promise<string[]>;
}
export function validateSelection(value: unknown) {
  try {
    return parseInventorySelection(value);
  } catch (e) {
    throw new AdminError(
      400,
      "INVALID_SELECTION",
      e instanceof Error ? e.message : "Review your inventory selection.",
    );
  }
}
export async function printEligibility(
  identity: AdminIdentity,
  selection: InventorySelection,
) {
  const rows = await inventoryRpc(
    identity,
    "admin_inventory_print_eligibility",
    { p_selection: validateSelection(selection) },
  );
  return rows.map(
    (r: {
      id: string;
      visibleCode: string;
      status: string;
      hasSecret: boolean;
      hasArchive: boolean;
      consumed: boolean;
      hasPrintHistory: boolean;
      hasOpenJob: boolean;
      contextEligible: boolean;
    }) => ({ ...r, eligibility: getPrintEligibility(identity.role, r) }),
  );
}
export async function getActiveTemplate(): Promise<StickerTemplate> {
  const { data, error } = await getSupabaseAdminClient()
    .from("qr_print_templates")
    .select("specification")
    .eq("active", true)
    .single();
  if (error || !data)
    throw new AdminError(
      503,
      "TEMPLATE_UNAVAILABLE",
      "The production sticker specification is unavailable. Please try again.",
    );
  return data.specification;
}
export async function getInventoryDetail(
  identity: AdminIdentity,
  id: string,
): Promise<InventoryDetail> {
  if (!canReadInventory(identity.role))
    throw new AdminError(403, "FORBIDDEN", "Your role cannot view inventory.");
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id))
    throw new AdminError(404, "NOT_FOUND", "This identity is not available.");
  const db = getAuthoritativeDatabaseClient();
  const row = await db.queryFirst<InventoryRow>(
    `SELECT s.id,s.public_id AS "publicId",s.visible_code AS "visibleCode",s.batch_id AS "batchId",b.reference_code AS "batchReference",b.inventory_channel AS channel,s.status,s.lifecycle_state AS lifecycle,s.created_at AS "createdAt",s.activated_at AS "activatedAt",CASE WHEN b.printed_at IS NOT NULL OR EXISTS(SELECT 1 FROM qr_print_items i WHERE i.qr_id=s.id AND i.printed_at IS NOT NULL) THEN 'RECORDED' ELSE 'UNRECORDED' END AS "printState",coalesce((SELECT max(printed_at) FROM qr_print_items WHERE qr_id=s.id),b.printed_at) AS "printedAt",coalesce(ret.name,dist.name) AS custodian,greatest(s.activation_attempts,coalesce(sec.failed_attempts,0)) AS "failedAttempts",s.replaced_by_qr_id IS NOT NULL AS "replacementLinked" FROM qr_stickers s LEFT JOIN qr_batches b ON b.id=s.batch_id LEFT JOIN admin_partners ret ON ret.id=s.current_retailer_id LEFT JOIN admin_partners dist ON dist.id=s.current_distributor_id LEFT JOIN qr_activation_secrets sec ON sec.qr_id=s.id WHERE s.id=?`,
    [id],
  );
  if (!row)
    throw new AdminError(404, "NOT_FOUND", "This identity is not available.");
  const [
    history,
    attempts,
    scanRows,
    audit,
    prints,
    binding,
    template,
    eligible,
  ] = await Promise.all([
    db.query<InventoryDetail["history"][number]>(
      `SELECT id,from_status AS "from",to_status AS "to",reason_code AS reason,created_at AS at FROM qr_status_history WHERE qr_id=? ORDER BY created_at DESC,id DESC LIMIT 20`,
      [id],
    ),
    db.query<InventoryDetail["attempts"][number]>(
      `SELECT outcome,count(*)::integer AS count FROM qr_activation_attempts WHERE qr_id=? GROUP BY outcome`,
      [id],
    ),
    db.query<{ total: number; lastAt: string | null; last24h: number }>(
      `SELECT count(*)::integer AS total,max(created_at) AS "lastAt",count(*) FILTER(WHERE created_at>now()-interval '24 hours')::integer AS "last24h" FROM qr_scan_events WHERE qr_id=?`,
      [id],
    ),
    db.query<InventoryDetail["audit"][number]>(
      `SELECT id,action,reason,created_at AS at,CASE WHEN resource_id=? THEN 'Identity' ELSE 'Batch' END AS scope FROM admin_audit_logs WHERE resource_id IN (?,?) ORDER BY created_at DESC,id DESC LIMIT 20`,
      [id, id, row.batchId],
    ),
    db.query<InventoryDetail["prints"][number]>(
      `SELECT j.id,j.reference_code AS reference,j.mode,j.status,j.quantity,j.created_at AS "createdAt",j.expires_at AS "expiresAt",j.reason FROM qr_print_items i JOIN qr_print_jobs j ON j.id=i.job_id WHERE i.qr_id=? ORDER BY j.created_at DESC LIMIT 10`,
      [id],
    ),
    db.queryFirst<{ active: boolean; replacement: string | null }>(
      `SELECT EXISTS(SELECT 1 FROM qr_assignments WHERE qr_id=? AND ended_at IS NULL) AS active,(SELECT r.visible_code FROM qr_stickers s JOIN qr_stickers r ON r.id=s.replaced_by_qr_id WHERE s.id=?) AS replacement`,
      [id, id],
    ),
    getActiveTemplate(),
    printEligibility(identity, { mode: "ids", ids: [id] }),
  ]);
  return {
    row,
    history,
    attempts,
    scans: scanRows[0]!,
    audit,
    prints,
    activeAssignment: !!binding?.active,
    replacement: binding?.replacement || null,
    template,
    eligibility: eligible[0].eligibility,
    safeSvg: renderStickerSvg(
      buildStickerScene(template, row.publicId, row.visibleCode),
    ),
  };
}
