import { z } from "zod";
import { adminResponse, adminFailure } from "../../../../../lib/api";
import {
  requireAdmin,
  assertSameOrigin,
  AdminError,
} from "../../../../../lib/session";
import {
  retailerRpc,
  validRetailerId,
} from "../../../../../features/retailers/server/retailers";
import {
  canManageRetailers,
  normalizeRetailerSearch,
} from "../../../../../features/retailers/retailer.filters";
const id = z.string().regex(/^[A-Za-z0-9_-]{1,100}$/),
  reason = z.string().trim().min(10).max(500);
const schema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("request-transfer"),
      source: id,
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
]);
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const identity = await requireAdmin("retailers");
    if (!canManageRetailers(identity.role))
      throw new AdminError(403, "FORBIDDEN", "Your role cannot manage stock.");
    return adminResponse(
      await retailerRpc(identity, "admin_retailer_transfer_options", {
        p_id: validRetailerId((await params).id),
        p_q: normalizeRetailerSearch(
          new URL(request.url).searchParams.get("q") || "",
        ),
      }),
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
    const identity = await requireAdmin("retailers"),
      retailer = validRetailerId((await params).id);
    if (!canManageRetailers(identity.role))
      throw new AdminError(403, "FORBIDDEN", "Your role cannot manage stock.");
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success)
      throw new AdminError(
        400,
        "INVALID_REQUEST",
        "Check the operation, quantities and required reason.",
      );
    const b = parsed.data,
      args = {
        p_id: retailer,
        p_reason: b.reason,
        p_request: crypto.randomUUID(),
      };
    let result;
    switch (b.action) {
      case "request-transfer":
        result = await retailerRpc(
          identity,
          "admin_retailer_request_transfer",
          {
            ...args,
            p_source: b.source,
            p_batch: b.batch,
            p_quantity: b.quantity,
          },
        );
        break;
      case "transfer-status":
        await retailerRpc(identity, "admin_retailer_transfer_transition", {
          ...args,
          p_transfer: b.transfer,
          p_from: b.from,
          p_to: b.to,
        });
        break;
      case "reconcile":
        result = await retailerRpc(identity, "admin_retailer_reconcile", {
          ...args,
          p_expected: b.expected,
          p_counted: b.counted,
        });
        break;
      case "review-reconciliation":
        await retailerRpc(identity, "admin_retailer_review_reconciliation", {
          ...args,
          p_record: b.record,
          p_updated_at: b.updatedAt,
          p_to: b.to,
        });
        break;
    }
    return adminResponse({ id: result || retailer });
  } catch (e) {
    return adminFailure(e);
  }
}
