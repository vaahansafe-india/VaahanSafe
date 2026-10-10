import { z } from "zod";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import { adminResponse, adminFailure } from "../../../../../lib/api";
import {
  requireAdmin,
  assertSameOrigin,
  AdminError,
} from "../../../../../lib/session";
import { canManageDistributors } from "../../../../../features/distributors/distributor.permissions";
import { distributorRpc } from "../../../../../features/distributors/server/distributors";
const id = z.string().regex(/^[A-Za-z0-9_-]{1,100}$/),
  reason = z.string().trim().min(10).max(500);
const schema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("request-transfer"),
      batch: id,
      quantity: z.number().int().min(1).max(5000),
      reason,
    })
    .strict(),
  z
    .object({
      action: z.literal("transfer-status"),
      transfer: id,
      from: z.enum(["REQUESTED", "IN_TRANSIT"]),
      to: z.enum(["IN_TRANSIT", "RECEIVED", "CANCELLED"]),
      reason,
    })
    .strict(),
  z
    .object({
      action: z.literal("reconcile"),
      expected: z.number().int().min(0),
      counted: z.number().int().min(0).max(10000000),
      reason,
    })
    .strict(),
  z
    .object({
      action: z.literal("review-reconciliation"),
      record: id,
      updatedAt: z.string().datetime({ offset: true }),
      to: z.enum(["REVIEWED", "CLOSED"]),
      reason,
    })
    .strict(),
  z
    .object({ action: z.literal("link-retailer"), retailer: id, reason })
    .strict(),
]);
export async function GET(request: Request) {
  try {
    const identity = await requireAdmin("distributors");
    if (!canManageDistributors(identity.role))
      throw new AdminError(403, "FORBIDDEN", "Your role cannot manage stock.");
    const p = new URL(request.url).searchParams;
    if (p.get("kind") === "retailers") {
      const term = (p.get("q") || "")
        .trim()
        .replace(/[^\p{L}\p{N} _-]/gu, "")
        .slice(0, 100);
      if (term.length < 2) return adminResponse([]);
      const { data, error } = await getSupabaseAdminClient()
        .from("admin_partners")
        .select("id,reference_code,name,city")
        .eq("kind", "RETAILER")
        .eq("status", "ACTIVE")
        .is("parent_distributor_id", null)
        .ilike("name", `%${term}%`)
        .order("name")
        .limit(20);
      if (error) throw error;
      return adminResponse(data);
    }
    return adminResponse(
      await distributorRpc(identity, "admin_distributor_transfer_options"),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin("distributors"),
      { id: distributor } = await params;
    if (!canManageDistributors(identity.role))
      throw new AdminError(
        403,
        "FORBIDDEN",
        "Your role cannot manage distributors.",
      );
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success || !id.safeParse(distributor).success)
      throw new AdminError(
        400,
        "INVALID_REQUEST",
        "Check the operation, quantities, and required reason.",
      );
    const b = parsed.data,
      args = {
        p_id: distributor,
        p_reason: b.reason,
        p_request: crypto.randomUUID(),
      };
    let result;
    switch (b.action) {
      case "request-transfer":
        result = await distributorRpc(
          identity,
          "admin_distributor_request_transfer",
          { ...args, p_batch: b.batch, p_quantity: b.quantity },
        );
        break;
      case "transfer-status":
        await distributorRpc(
          identity,
          "admin_distributor_transfer_transition",
          { ...args, p_transfer: b.transfer, p_from: b.from, p_to: b.to },
        );
        break;
      case "reconcile":
        result = await distributorRpc(identity, "admin_distributor_reconcile", {
          ...args,
          p_expected: b.expected,
          p_counted: b.counted,
        });
        break;
      case "review-reconciliation":
        await distributorRpc(
          identity,
          "admin_distributor_review_reconciliation",
          {
            ...args,
            p_record: b.record,
            p_updated_at: b.updatedAt,
            p_to: b.to,
          },
        );
        break;
      case "link-retailer":
        await distributorRpc(identity, "admin_distributor_link_retailer", {
          ...args,
          p_retailer: b.retailer,
        });
        break;
    }
    return adminResponse({ id: result || distributor });
  } catch (e) {
    return adminFailure(e);
  }
}
