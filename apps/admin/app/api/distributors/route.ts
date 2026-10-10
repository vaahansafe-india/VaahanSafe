import { adminResponse, adminFailure } from "../../../lib/api";
import { requireAdmin, assertSameOrigin } from "../../../lib/session";
import { parseDistributorFilters } from "../../../features/distributors/distributor.filters";
import {
  listDistributors,
  saveDistributor,
} from "../../../features/distributors/server/distributors";
export async function GET(request: Request) {
  try {
    const identity = await requireAdmin("distributors"),
      p = new URL(request.url).searchParams;
    return adminResponse(
      await listDistributors(
        identity,
        parseDistributorFilters(p),
        p.get("cursor"),
      ),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin("distributors");
    return adminResponse(
      { id: await saveDistributor(identity, await request.json()) },
      201,
    );
  } catch (e) {
    return adminFailure(e);
  }
}
