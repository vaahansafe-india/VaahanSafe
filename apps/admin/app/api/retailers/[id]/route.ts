import { adminResponse, adminFailure } from "../../../../lib/api";
import {
  requireAdmin,
  assertSameOrigin,
  AdminError,
} from "../../../../lib/session";
import {
  getRetailerDetail,
  saveRetailer,
  retailerRpc,
  validRetailerId,
} from "../../../../features/retailers/server/retailers";
import { canManageRetailers } from "../../../../features/retailers/retailer.filters";
import { z } from "zod";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    return adminResponse(
      await getRetailerDetail(
        await requireAdmin("retailers"),
        (await params).id,
      ),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
const statusSchema = z
  .object({
    status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
    verification: z
      .enum(["PENDING", "VERIFIED", "REQUIRES_CORRECTION"])
      .optional(),
    updatedAt: z.string().datetime({ offset: true }),
    reason: z.string().trim().min(10).max(500),
  })
  .strict()
  .refine((v) => v.status || v.verification);
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin("retailers"),
      id = validRetailerId((await params).id),
      body = await request.json();
    if (!canManageRetailers(identity.role))
      throw new AdminError(
        403,
        "FORBIDDEN",
        "Your role cannot manage retailers.",
      );
    if (body.values)
      return adminResponse({ id: await saveRetailer(identity, body, id) });
    const b = statusSchema.safeParse(body);
    if (!b.success)
      throw new AdminError(
        400,
        "INVALID_REQUEST",
        "Check the status, reason and record version.",
      );
    await retailerRpc(identity, "admin_retailer_status", {
      p_id: id,
      p_updated_at: b.data.updatedAt,
      p_status: b.data.status || null,
      p_verification: b.data.verification || null,
      p_reason: b.data.reason,
      p_request: crypto.randomUUID(),
    });
    return adminResponse({ id });
  } catch (e) {
    return adminFailure(e);
  }
}
