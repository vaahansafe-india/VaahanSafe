import { adminResponse, adminFailure } from "../../../../lib/api";
import {
  requireAdmin,
  assertSameOrigin,
  AdminError,
} from "../../../../lib/session";
import {
  getDistributorDetail,
  saveDistributor,
  distributorRpc,
} from "../../../../features/distributors/server/distributors";
import { canManageDistributors } from "../../../../features/distributors/distributor.permissions";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) {
  try {
    return adminResponse(
      await getDistributorDetail(
        await requireAdmin("distributors"),
        (await params).id,
      ),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
export async function PATCH(request: Request, { params }: Context) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin("distributors"),
      { id } = await params,
      body = await request.json();
    if (!canManageDistributors(identity.role))
      throw new AdminError(
        403,
        "FORBIDDEN",
        "Your role cannot change distributors.",
      );
    if (body.action === "status") {
      if (
        typeof body.reason !== "string" ||
        body.reason.trim().length < 10 ||
        body.reason.length > 500 ||
        typeof body.updatedAt !== "string" ||
        !Number.isFinite(Date.parse(body.updatedAt))
      )
        throw new AdminError(
          400,
          "INVALID_REQUEST",
          "Provide a reason and reload the latest record.",
        );
      await distributorRpc(identity, "admin_distributor_status", {
        p_id: id,
        p_updated_at: body.updatedAt,
        p_status: body.status ?? null,
        p_verification: body.verification ?? null,
        p_reason: body.reason.trim(),
        p_request: crypto.randomUUID(),
      });
      return adminResponse({ id });
    }
    return adminResponse({ id: await saveDistributor(identity, body, id) });
  } catch (e) {
    return adminFailure(e);
  }
}
