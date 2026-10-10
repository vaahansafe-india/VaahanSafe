import { adminResponse, adminFailure } from "../../../../../lib/api";
import { requireAdmin, assertSameOrigin } from "../../../../../lib/session";
import { voidBatch } from "../../../../../features/batches/server/batch-actions";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin("batches");
    const { id } = await params;
    const body = (await request.json()) as { reason: string; mode?: "VOIDED" | "QUARANTINED" };

    const result = await voidBatch(
      identity,
      id,
      body.reason || "Voided by operator",
      body.mode || "VOIDED",
    );
    return adminResponse(result);
  } catch (error) {
    return adminFailure(error);
  }
}
