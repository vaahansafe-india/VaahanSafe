import "server-only";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import { z } from "zod";
import type { AdminIdentity } from "../../../lib/contracts";
import { AdminError } from "../../../lib/session";
import { canReadModule } from "../../../lib/modules";
import { replacementCursor, replacementPage } from "../replacement.filters";
import type {
  ReplacementFilters,
  ReplacementRow,
  ReplacementDetail,
  ReplacementSummary,
  ReplacementHistory,
  ReplacementOptions,
} from "../replacement.types";
export function replacementId(id: string) {
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id))
    throw new AdminError(
      400,
      "INVALID_REFERENCE",
      "Choose a valid replacement.",
    );
  return id;
}
export async function replacementRpc<T>(
  i: AdminIdentity,
  name: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  if (!canReadModule(i.role, "replacements"))
    throw new AdminError(
      403,
      "FORBIDDEN",
      "Your role cannot access replacements.",
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
        "This replacement could not be found.",
      );
    if (/STATE_CHANGED|STOCK_CHANGED|REQUEST_CONFLICT/.test(m))
      throw new AdminError(
        409,
        "STATE_CHANGED",
        "This replacement or its stock changed. Refresh before continuing.",
      );
    if (/ADMIN_REQUIRED/.test(m))
      throw new AdminError(
        403,
        "FORBIDDEN",
        "Sign in with an authorized admin account and fresh email verification.",
      );
    if (/INVALID_PAID_ORDER/.test(m))
      throw new AdminError(
        409,
        "PAYMENT_REQUIRED",
        "Choose an unused, verified paid replacement order for this vehicle with a complete shipping address.",
      );
    if (/INVALID_SHIPMENT/.test(m))
      throw new AdminError(
        409,
        "SHIPMENT_REQUIRED",
        "A dispatched shipment must be recorded by the configured shipping service.",
      );
    if (/INVALID_/.test(m))
      throw new AdminError(
        400,
        "INVALID_ACTION",
        "Review the current workflow, eligibility, selected order and required reason.",
      );
    if (/RATE_LIMIT/.test(m))
      throw new AdminError(
        429,
        "RATE_LIMITED",
        "Wait before requesting another report.",
      );
    console.error("[replacement] RPC failed", {
      operation: name,
      code: error.code,
    });
    throw new AdminError(
      503,
      "REPLACEMENT_UNAVAILABLE",
      "We couldn't load or update replacements right now. Please try again.",
    );
  }
  return data as T;
}
export async function listReplacements(
  i: AdminIdentity,
  f: ReplacementFilters,
  c: string | null = null,
) {
  let cursor;
  try {
    cursor = replacementCursor(c);
  } catch {
    throw new AdminError(400, "INVALID_CURSOR", "Refresh this list.");
  }
  return replacementPage(
    await replacementRpc<ReplacementRow[]>(i, "admin_replacement_list", {
      p_filters: f,
      p_cursor: cursor,
    }),
  );
}
export const replacementSummary = (i: AdminIdentity) =>
  replacementRpc<ReplacementSummary>(i, "admin_replacement_summary");
export const replacementDetail = (i: AdminIdentity, id: string) =>
  replacementRpc<ReplacementDetail>(i, "admin_replacement_detail", {
    p_id: replacementId(id),
  });
export const replacementOptions = (i: AdminIdentity, id: string) => {
  if (!["SUPER_ADMIN", "OPS_ADMIN"].includes(i.role))
    throw new AdminError(
      403,
      "FORBIDDEN",
      "Allocation options are available to authorized operations admins.",
    );
  return replacementRpc<ReplacementOptions>(i, "admin_replacement_options", {
    p_id: replacementId(id),
  });
};
export async function replacementHistory(
  i: AdminIdentity,
  id: string,
  section: string,
  c: string | null,
) {
  if (!["timeline", "audit", "lineage"].includes(section))
    throw new AdminError(
      400,
      "INVALID_SECTION",
      "Choose a valid detail section.",
    );
  let cursor;
  try {
    cursor = replacementCursor(c);
  } catch {
    throw new AdminError(400, "INVALID_CURSOR", "Refresh this panel.");
  }
  return replacementPage(
    await replacementRpc<ReplacementHistory[]>(i, "admin_replacement_history", {
      p_id: replacementId(id),
      p_section: section,
      p_cursor: cursor,
    }),
    20,
  );
}
const commandSchema = z
  .object({
    action: z.enum([
      "review",
      "approve",
      "reject",
      "allocate",
      "retire",
      "pack",
      "sync_shipment",
      "close",
      "cancel",
    ]),
    revision: z.number().int().nonnegative(),
    requestId: z.string().uuid(),
    reason: z.string().trim().min(10).max(500),
    values: z
      .object({
        order: z.string().max(100).optional(),
        batch: z.string().max(100).optional(),
        riskAcknowledged: z.boolean().optional(),
      })
      .strict(),
    confirmed: z.literal(true),
  })
  .strict();
export async function replacementCommand(
  i: AdminIdentity,
  id: string,
  body: unknown,
) {
  if (!["SUPER_ADMIN", "OPS_ADMIN"].includes(i.role))
    throw new AdminError(
      403,
      "FORBIDDEN",
      "Your role can inspect replacements but cannot change them.",
    );
  const p = commandSchema.safeParse(body);
  if (!p.success)
    throw new AdminError(
      400,
      "INVALID_COMMAND",
      "Review the action, operational reason and consequences.",
    );
  const b = p.data;
  return replacementRpc<string>(i, "admin_replacement_command", {
    p_id: replacementId(id),
    p_action: b.action,
    p_revision: b.revision,
    p_values: b.values,
    p_reason: b.reason,
    p_request: b.requestId,
  });
}
