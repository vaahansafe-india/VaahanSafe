import "server-only";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import { AdminError } from "../../../lib/session";
import { canReadModule } from "../../../lib/modules";
import type { AdminIdentity } from "../../../lib/contracts";
import type {
  RetailerFilters,
  RetailerRow,
  RetailerDetail,
  RetailerSummary,
  RetailerHistoryRow,
  HistorySection,
} from "../retailer.types";
import { decodeDistributorCursor } from "../../distributors/distributor.filters";
import { retailerSchema } from "../retailer.schema";
import { canManageRetailers } from "../retailer.filters";
export async function retailerRpc<T>(
  identity: AdminIdentity,
  name: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  if (!canReadModule(identity.role, "retailers"))
    throw new AdminError(
      403,
      "FORBIDDEN",
      "Your role cannot access retailers.",
    );
  const { data, error } = await getSupabaseAdminClient()
    .rpc(name, { p_session: identity.sessionId, ...args })
    .abortSignal(AbortSignal.timeout(15000));
  if (error) {
    const m = error.message;
    if (/RETAILER_CHANGED/.test(m))
      throw new AdminError(
        409,
        "RETAILER_CHANGED",
        "Another administrator updated this retailer. Reload the latest record and try again.",
      );
    if (/TERRITORY_REVIEW_REQUIRED/.test(m))
      throw new AdminError(
        409,
        "TERRITORY_REVIEW_REQUIRED",
        "Review the distributor territory warning and record your reason before continuing.",
      );
    if (/NETWORK_STOCK_REVIEW_REQUIRED/.test(m))
      throw new AdminError(
        409,
        "NETWORK_REVIEW_REQUIRED",
        "Complete open transfers and review existing stock before changing the supplying distributor.",
      );
    if (/DISTRIBUTOR_UNAVAILABLE/.test(m))
      throw new AdminError(
        409,
        "DISTRIBUTOR_UNAVAILABLE",
        "Choose an active supplying distributor.",
      );
    if (/RETAILER_NOT_FOUND/.test(m))
      throw new AdminError(
        404,
        "NOT_FOUND",
        "This retailer could not be found.",
      );
    if (/ADMIN_REQUIRED/.test(m))
      throw new AdminError(
        403,
        "FORBIDDEN",
        "Sign in with an authorized admin account to continue.",
      );
    if (/STOCK_CHANGED|TRANSFER_CHANGED/.test(m))
      throw new AdminError(
        409,
        "STOCK_CHANGED",
        "Stock or transfer status changed. Reload the latest record and review the request.",
      );
    if (/SUSPENDED_PARTNER|VERIFICATION_REQUIRED/.test(m))
      throw new AdminError(
        409,
        "OPERATION_RESTRICTED",
        "Stock requests and dispatch require an active, verified retailer and an active distributor.",
      );
    if (/INVALID_|REASON_REQUIRED|SETUP_REQUIRED|INSUFFICIENT_STOCK/.test(m))
      throw new AdminError(
        400,
        "INVALID_REQUEST",
        "Check required fields, location, quantities and available printed stock.",
      );
    if (/EXPORT_RATE_LIMIT/.test(m))
      throw new AdminError(
        429,
        "EXPORT_RATE_LIMIT",
        "Too many exports were requested. Please try again later.",
      );
    console.error("[retailers] operation failed", {
      operation: name,
      code: error.code,
    });
    throw new AdminError(
      503,
      "RETAILERS_UNAVAILABLE",
      "We couldn't load or update retailers right now. Please try again.",
    );
  }
  return data as T;
}
export function parseRetailerCursor(cursor: string | null) {
  try {
    return decodeDistributorCursor(cursor);
  } catch {
    throw new AdminError(
      400,
      "INVALID_CURSOR",
      "Refresh this retailer list to restart.",
    );
  }
}
export function pageOf<T extends { id: string; created_at: string }>(
  records: T[],
  size: number,
) {
  const rows = records.slice(0, size),
    last = rows.at(-1);
  return {
    rows,
    nextCursor:
      records.length > size && last
        ? btoa(JSON.stringify({ id: last.id, created_at: last.created_at }))
        : null,
  };
}
export async function listRetailers(
  identity: AdminIdentity,
  filters: RetailerFilters,
  cursor: string | null = null,
) {
  return pageOf(
    await retailerRpc<RetailerRow[]>(identity, "admin_retailer_list", {
      p_filters: filters,
      p_cursor: parseRetailerCursor(cursor),
    }),
    50,
  );
}
export const getRetailerSummary = (identity: AdminIdentity) =>
  retailerRpc<RetailerSummary>(identity, "admin_retailer_summary");
export const getRetailerDetail = (identity: AdminIdentity, id: string) =>
  retailerRpc<RetailerDetail>(identity, "admin_retailer_detail", {
    p_id: validRetailerId(id),
  });
export function validRetailerId(id: string) {
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id))
    throw new AdminError(400, "INVALID_REFERENCE", "Choose a valid retailer.");
  return id;
}
export async function retailerHistory(
  identity: AdminIdentity,
  id: string,
  section: string,
  cursor: string | null,
) {
  if (
    ![
      "inventory",
      "transfers",
      "activations",
      "reconciliations",
      "activity",
    ].includes(section)
  )
    throw new AdminError(
      400,
      "INVALID_SECTION",
      "Choose a valid retailer section.",
    );
  return pageOf(
    await retailerRpc<RetailerHistoryRow[]>(
      identity,
      "admin_retailer_history",
      {
        p_id: validRetailerId(id),
        p_section: section as HistorySection,
        p_cursor: parseRetailerCursor(cursor),
      },
    ),
    20,
  );
}
export async function saveRetailer(
  identity: AdminIdentity,
  body: unknown,
  id: string | null = null,
) {
  if (!canManageRetailers(identity.role))
    throw new AdminError(
      403,
      "FORBIDDEN",
      "Your role cannot manage retailers.",
    );
  const payload = body as { values: unknown; updatedAt?: string };
  const parsed = retailerSchema.safeParse(payload?.values);
  if (!parsed.success)
    throw new AdminError(
      400,
      "INVALID_RETAILER",
      "Check required business, distributor, location and contact fields.",
    );
  const { reason, ...values } = parsed.data;
  return retailerRpc<string>(identity, "admin_retailer_save", {
    p_id: id ? validRetailerId(id) : null,
    p_updated_at: payload.updatedAt || null,
    p_values: values,
    p_reason: reason,
    p_request: crypto.randomUUID(),
  });
}
