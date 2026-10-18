import "server-only";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import type { AdminIdentity } from "../../../lib/contracts";
import { AdminError } from "../../../lib/session";
import { canReadModule } from "../../../lib/modules";
import {
  reconciliationCursor,
  reconciliationPage,
  historyCursor,
} from "../reconciliation.filters";
import { reconciliationCommandSchema } from "../reconciliation.schema";
import type {
  ReconciliationFilters,
  ReconciliationRow,
  ReconciliationSummary,
  ReconciliationDetail,
  ReconciliationHistory,
  CustodianOption,
  LedgerSnapshot,
} from "../reconciliation.types";
export async function reconciliationRpc<T>(
  i: AdminIdentity,
  name: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  if (!canReadModule(i.role, "reconciliation"))
    throw new AdminError(
      403,
      "FORBIDDEN",
      "Your role cannot access stock reconciliation.",
    );
  const { data, error } = await getSupabaseAdminClient()
    .rpc(name, { p_session: i.sessionId, ...args })
    .abortSignal(AbortSignal.timeout(20000));
  if (error) {
    const m = error.message;
    if (/NOT_FOUND/.test(m))
      throw new AdminError(
        404,
        "NOT_FOUND",
        "This reconciliation could not be found.",
      );
    if (/STATE_CHANGED|STOCK_CHANGED|REQUEST_CONFLICT/.test(m))
      throw new AdminError(
        409,
        "RECONCILIATION_STATE_CHANGED",
        "This record or its stock changed. Refresh the latest reconciliation before continuing.",
      );
    if (/TRANSFER_CONTROL_REQUIRED/.test(m))
      throw new AdminError(
        409,
        "TRANSFER_CONTROL_REQUIRED",
        "Resolve this shipment in Transfers. Receipt and custody changes remain linked to its QR manifest.",
      );
    if (/ADMIN_REQUIRED/.test(m))
      throw new AdminError(
        403,
        "FORBIDDEN",
        "Sign in with an authorized admin account and fresh email verification.",
      );
    if (/RATE_LIMIT/.test(m))
      throw new AdminError(
        429,
        "RATE_LIMITED",
        "Wait before requesting another report.",
      );
    if (/INVALID_/.test(m))
      throw new AdminError(
        400,
        "INVALID_REQUEST",
        "Check the count, selected identities, current workflow and operational reason.",
      );
    console.error("[reconciliation] RPC failed", {
      operation: name,
      code: error.code,
    });
    throw new AdminError(
      503,
      "RECONCILIATION_UNAVAILABLE",
      "We couldn't load or update reconciliations right now. Please try again.",
    );
  }
  return data as T;
}
export function validReconciliationId(id: string) {
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id))
    throw new AdminError(
      400,
      "INVALID_REFERENCE",
      "Choose a valid reconciliation.",
    );
  return id;
}
export async function listReconciliations(
  i: AdminIdentity,
  f: ReconciliationFilters,
  c: string | null = null,
) {
  let cursor;
  try {
    cursor = reconciliationCursor(c);
  } catch {
    throw new AdminError(
      400,
      "INVALID_CURSOR",
      "Refresh to restart this list.",
    );
  }
  return reconciliationPage(
    await reconciliationRpc<ReconciliationRow[]>(
      i,
      "admin_reconciliation_list",
      { p_filters: f, p_cursor: cursor },
    ),
  );
}
export const reconciliationSummary = (i: AdminIdentity) =>
  reconciliationRpc<ReconciliationSummary>(i, "admin_reconciliation_summary");
export const reconciliationDetail = (i: AdminIdentity, id: string) =>
  reconciliationRpc<ReconciliationDetail>(i, "admin_reconciliation_detail", {
    p_id: validReconciliationId(id),
  });
export const reconciliationPartners = (
  i: AdminIdentity,
  q: string,
  kind: string,
) =>
  reconciliationRpc<CustodianOption[]>(i, "admin_reconciliation_partners", {
    p_q: q.replace(/[%_\\]/g, "").slice(0, 100),
    p_kind: ["DISTRIBUTOR", "RETAILER"].includes(kind) ? kind : "",
  });
export const reconciliationSnapshot = (
  i: AdminIdentity,
  partner: string,
  batches: string[],
) =>
  reconciliationRpc<LedgerSnapshot>(i, "admin_reconciliation_snapshot", {
    p_partner: partner === "central" ? null : validReconciliationId(partner),
    p_batches: batches.map(validReconciliationId),
  });
export async function reconciliationHistory(
  i: AdminIdentity,
  id: string,
  section: string,
  c: string | null,
  q: string,
) {
  if (!["timeline", "audit", "batches", "identities"].includes(section))
    throw new AdminError(
      400,
      "INVALID_SECTION",
      "Choose a valid detail section.",
    );
  let cursor;
  try {
    cursor = historyCursor(c);
  } catch {
    throw new AdminError(400, "INVALID_CURSOR", "Refresh this panel.");
  }
  const rows = await reconciliationRpc<ReconciliationHistory[]>(
    i,
    "admin_reconciliation_history",
    {
      p_id: validReconciliationId(id),
      p_section: section,
      p_cursor: cursor,
      p_q: q.replace(/[^A-Za-z0-9-]/g, "").slice(0, 70),
    },
  );
  return section === "batches"
    ? { rows, nextCursor: null }
    : reconciliationPage(rows, section === "identities" ? 50 : 20);
}
export async function reconciliationCommand(
  i: AdminIdentity,
  id: string | null,
  body: unknown,
) {
  if (!["SUPER_ADMIN", "OPS_ADMIN"].includes(i.role))
    throw new AdminError(
      403,
      "FORBIDDEN",
      "Your role can inspect stock but cannot change reconciliations.",
    );
  const parsed = reconciliationCommandSchema.safeParse(body);
  if (!parsed.success)
    throw new AdminError(
      400,
      "INVALID_REQUEST",
      "Review all action fields and the required operational reason.",
    );
  const b = parsed.data;
  if ((!id && b.action !== "create") || (id && b.action === "create"))
    throw new AdminError(400, "INVALID_ACTION", "Choose a valid action.");
  return reconciliationRpc<string>(i, "admin_reconciliation_command", {
    p_id: id ? validReconciliationId(id) : null,
    p_action: b.action,
    p_revision: b.revision ?? null,
    p_values: b.values,
    p_reason: b.reason,
    p_request: b.requestId,
  });
}
