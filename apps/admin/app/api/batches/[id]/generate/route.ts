import { adminResponse, adminFailure } from "../../../../../lib/api";
import { requireAdmin, assertSameOrigin } from "../../../../../lib/session";
import { generateBatchIdentities } from "../../../../../features/batches/server/batch-actions";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin("batches");
    const { id } = await params;

    const result = await generateBatchIdentities(identity, id);
    return adminResponse(result);
  } catch (error) {
    return adminFailure(error);
  }
}
