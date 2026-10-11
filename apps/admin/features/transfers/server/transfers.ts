import "server-only";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import { AdminError } from "../../../lib/session";
import { canReadModule } from "../../../lib/modules";
import type { AdminIdentity } from "../../../lib/contracts";
import type {
  TransferFilters,
  TransferRow,
  TransferSummary,
  TransferDetail,
  TransferHistory,
} from "../transfer.types";
import { transferCursor, transferPage } from "../transfer.filters";
import { isReceiptCode, normalizeReceiptCode } from "../receipt-validation";
export async function transferRpc<T>(
  identity: AdminIdentity,
  name: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  if (!canReadModule(identity.role, "transfers"))
    throw new AdminError(
      403,
      "FORBIDDEN",
      "Your role cannot access transfers.",
    );
  const { data, error } = await getSupabaseAdminClient()
    .rpc(name, { p_session: identity.sessionId, ...args })
    .abortSignal(AbortSignal.timeout(15000));
  if (error) {
    const message = error.message;
    if (/TRANSFER_NOT_FOUND/.test(message))
      throw new AdminError(
        404,
        "NOT_FOUND",
        "This transfer could not be found.",
      );
    if (/TRANSFER_CHANGED|STOCK_CHANGED|REQUEST_CONFLICT/.test(message))
      throw new AdminError(
        409,
        "TRANSFER_CHANGED",
        "Stock or this transfer changed. Refresh the latest record and review it before continuing.",
      );
    if (/ADMIN_REQUIRED/.test(message))
      throw new AdminError(
        403,
        "FORBIDDEN",
        "An authorized admin with a fresh email verification is required.",
      );
    if (/RATE_LIMIT/.test(message))
      throw new AdminError(
        429,
        "RATE_LIMITED",
        "Please wait a moment before requesting another export.",
      );
    if (/INSUFFICIENT_STOCK/.test(message))
      throw new AdminError(
        409,
        "INSUFFICIENT_STOCK",
        "There is not enough eligible printed stock. Refresh inventory and adjust the quantities.",
      );
    if (/PARTNER_UNAVAILABLE|INVALID_ROUTE/.test(message))
      throw new AdminError(
        409,
        "INVALID_ROUTE",
        "Use an active distributor, or its active, verified retailer.",
      );
    if (/UNRESOLVED_RECEIPT/.test(message))
      throw new AdminError(
        409,
        "UNRESOLVED_RECEIPT",
        "Account for every pending or missing QR identity before reconciliation.",
      );
    if (/INVALID_RECEIPT/.test(message))
      throw new AdminError(
        400,
        "INVALID_RECEIPT",
        "Use the printed VaahanSafe IDs in this transfer’s QR manifest. Each ID must match its pending receipt or missing resolution category.",
      );
    if (/INVALID_|REASON_REQUIRED/.test(message))
      throw new AdminError(
        400,
        "INVALID_REQUEST",
        "Review the action, QR identities, quantities and required reason. Each QR can be recorded once.",
      );
    console.error("[transfers] RPC failed", {
      operation: name,
      code: error.code,
    });
    throw new AdminError(
      503,
      "TRANSFERS_UNAVAILABLE",
      "We couldn't load or update transfers right now. Please try again.",
    );
  }
  return data as T;
}
export function validTransferId(id: string) {
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id))
    throw new AdminError(400, "INVALID_REFERENCE", "Choose a valid transfer.");
  return id;
}
function cursor(value: string | null) {
  try {
    return transferCursor(value);
  } catch {
    throw new AdminError(
      400,
      "INVALID_CURSOR",
      "Refresh this list to restart.",
    );
  }
}
export async function listTransfers(
  identity: AdminIdentity,
  filters: TransferFilters,
  c: string | null = null,
) {
  return transferPage(
    await transferRpc<TransferRow[]>(identity, "admin_transfer_list", {
      p_filters: filters,
      p_cursor: cursor(c),
    }),
    50,
  );
}
export const transferSummary = (i: AdminIdentity) =>
  transferRpc<TransferSummary>(i, "admin_transfer_summary");
export const transferDetail = (i: AdminIdentity, id: string) =>
  transferRpc<TransferDetail>(i, "admin_transfer_detail", {
    p_id: validTransferId(id),
  });
export async function transferHistory(
  i: AdminIdentity,
  id: string,
  section: string,
  c: string | null,
  q: string,
) {
  if (!["timeline", "contents", "audit"].includes(section))
    throw new AdminError(400, "INVALID_SECTION", "Choose a valid section.");
  return transferPage(
    await transferRpc<TransferHistory[]>(i, "admin_transfer_history", {
      p_id: validTransferId(id),
      p_section: section,
      p_cursor: cursor(c),
      p_q: q.slice(0, 100),
    }),
    section === "contents" ? 50 : 20,
  );
}
export async function transferCommand(
  i: AdminIdentity,
  id: string | null,
  body: unknown,
) {
  if (!["SUPER_ADMIN", "OPS_ADMIN"].includes(i.role))
    throw new AdminError(
      403,
      "FORBIDDEN",
      "Your role can view transfers but cannot change custody.",
    );
  const b = body as {
    action?: string;
    revision?: number;
    values?: Record<string, unknown>;
    reason?: string;
    requestId?: string;
  };
  if (
    !b ||
    ![
      "request",
      "approve",
      "dispatch",
      "receive",
      "resolve",
      "reconcile",
      "cancel",
      "reject",
      "close",
    ].includes(b.action || "") ||
    typeof b.reason !== "string" ||
    b.reason.trim().length < 10 ||
    b.reason.length > 500 ||
    !b.values ||
    typeof b.values !== "object" ||
    Array.isArray(b.values) ||
    typeof b.requestId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      b.requestId,
    ) ||
    (!id && b.action !== "request") ||
    (id && (b.action === "request" || !Number.isInteger(b.revision)))
  )
    throw new AdminError(
      400,
      "INVALID_REQUEST",
      "Review all required fields and the reason for this action.",
    );
  if (b.action === "request") {
    const allocations = b.values.allocations as {
      batch?: unknown;
      quantity?: unknown;
    }[];
    if (
      typeof b.values.destination !== "string" ||
      (b.values.source != null && typeof b.values.source !== "string") ||
      !Array.isArray(allocations) ||
      allocations.length < 1 ||
      allocations.length > 20 ||
      allocations.some(
        (a) =>
          !a ||
          typeof a.batch !== "string" ||
          !/^[A-Za-z0-9_-]{1,100}$/.test(a.batch) ||
          typeof a.quantity !== "number" ||
          !Number.isInteger(a.quantity) ||
          a.quantity < 1 ||
          a.quantity > 5000,
      ) ||
      new Set(allocations.map((a) => a.batch)).size !== allocations.length ||
      allocations.reduce((n, a) => n + Number(a.quantity), 0) > 5000
    )
      throw new AdminError(
        400,
        "INVALID_REQUEST",
        "Choose unique printed batches and whole quantities, up to 5,000 units.",
      );
  }
  const allowedValues: Record<string, string[]> = {
    request: ["source", "destination", "allocations"],
    dispatch: ["carrier", "tracking", "expectedArrival"],
    receive: ["received", "damaged", "missing", "finalReceipt"],
    resolve: ["found", "lost"],
  };
  if (
    Object.keys(b.values).some(
      (key) => !(allowedValues[b.action!] || []).includes(key),
    )
  )
    throw new AdminError(
      400,
      "INVALID_REQUEST",
      "Review the fields for this transfer action.",
    );
  if (
    b.action === "dispatch" &&
    (typeof b.values.carrier !== "string" ||
      b.values.carrier.length > 100 ||
      typeof b.values.tracking !== "string" ||
      b.values.tracking.length > 150 ||
      (b.values.expectedArrival != null &&
        (typeof b.values.expectedArrival !== "string" ||
          !Number.isFinite(Date.parse(b.values.expectedArrival)))))
  )
    throw new AdminError(
      400,
      "INVALID_REQUEST",
      "Review the carrier, handover reference and expected arrival.",
    );
  if (
    b.action === "receive" &&
    b.values.finalReceipt != null &&
    typeof b.values.finalReceipt !== "boolean"
  )
    throw new AdminError(
      400,
      "INVALID_RECEIPT",
      "Choose whether this is the final physical receipt.",
    );
  if (b.action === "receive" || b.action === "resolve") {
    const all: string[] = [];
    for (const key of b.action === "receive"
      ? ["received", "damaged", "missing"]
      : ["found", "lost"]) {
      const codes = b.values[key] ?? [];
      if (
        !Array.isArray(codes) ||
        codes.length > 5000 ||
        codes.some(
          (c: unknown) =>
            typeof c !== "string" ||
            c.length > 100 ||
            !isReceiptCode(normalizeReceiptCode(c)),
        )
      )
        throw new AdminError(
          400,
          "INVALID_RECEIPT",
          "Enter printed VaahanSafe IDs starting with VS-. Put condition notes in Operational reason.",
        );
      const normalized = codes.map(normalizeReceiptCode);
      b.values[key] = normalized;
      all.push(...normalized);
    }
    if (new Set(all).size !== all.length || all.length > 5000)
      throw new AdminError(
        400,
        "INVALID_RECEIPT",
        "Each identity must appear once, in one receipt category.",
      );
  }
  return transferRpc<string>(i, "admin_transfer_command", {
    p_id: id ? validTransferId(id) : null,
    p_revision: b.revision || null,
    p_action: b.action,
    p_values: b.values,
    p_reason: b.reason,
    p_request: b.requestId,
  });
}
