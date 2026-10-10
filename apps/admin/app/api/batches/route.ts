import { adminResponse, adminFailure } from "../../../lib/api";
import { requireAdmin, assertSameOrigin } from "../../../lib/session";
import { listBatches } from "../../../features/batches/server/read-batches";
import { createBatch } from "../../../features/batches/server/batch-actions";
import type { BatchFilters, CreateBatchInput } from "../../../features/batches/batches.types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const identity = await requireAdmin("batches");
    const { searchParams } = new URL(request.url);

    const q = searchParams.get("q") || "";
    const statuses = searchParams.getAll("status");
    const channels = searchParams.getAll("channel");
    const print = (searchParams.get("print") as any) || "any";
    const sort = (searchParams.get("sort") as any) || "newest";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const limit = Math.min(Number(searchParams.get("limit") || 25), 100);

    const cursorStr = searchParams.get("cursor");
    let cursor: { createdAt: string; id: string } | null = null;
    if (cursorStr && cursorStr.includes("|")) {
      const [createdAt, id] = cursorStr.split("|");
      if (createdAt && id) cursor = { createdAt, id };
    }

    const filters: BatchFilters = {
      q,
      statuses,
      channels,
      print,
      sort,
      from,
      to,
    };

    const data = await listBatches(identity, filters, cursor, limit);
    return adminResponse(data);
  } catch (error) {
    return adminFailure(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin("batches");
    const body = (await request.json()) as CreateBatchInput;

    const result = await createBatch(identity, body);
    return adminResponse(result);
  } catch (error) {
    return adminFailure(error);
  }
}
