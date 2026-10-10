import { adminResponse, adminFailure } from "../../../../lib/api";
import { requireAdmin, assertSameOrigin } from "../../../../lib/session";
import { getBatchDetail } from "../../../../features/batches/server/read-batches";
import { transitionBatchStatus } from "../../../../features/batches/server/batch-actions";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const identity = await requireAdmin("batches");
    const { id } = await params;
    const data = await getBatchDetail(identity, id);
    return adminResponse(data);
  } catch (error) {
    return adminFailure(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin("batches");
    const { id } = await params;
    const body = (await request.json()) as { toStatus: any; reason?: string };

    const data = await transitionBatchStatus(
      identity,
      id,
      body.toStatus,
      body.reason,
    );
    return adminResponse(data);
  } catch (error) {
    return adminFailure(error);
  }
}
