import { adminResponse, adminFailure } from "../../../../lib/api";
import { requireAdmin } from "../../../../lib/session";
import { getBatchesSummary } from "../../../../features/batches/server/read-batches";

export const runtime = "nodejs";

export async function GET() {
  try {
    const identity = await requireAdmin("batches");
    const data = await getBatchesSummary(identity);
    return adminResponse(data);
  } catch (error) {
    return adminFailure(error);
  }
}
