import { adminResponse, adminFailure } from "../../../lib/api";
import { requireAdmin, assertSameOrigin } from "../../../lib/session";
import {
  listRetailers,
  saveRetailer,
} from "../../../features/retailers/server/retailers";
import { parseRetailerFilters } from "../../../features/retailers/retailer.filters";
export async function GET(request: Request) {
  try {
    const identity = await requireAdmin("retailers"),
      p = new URL(request.url).searchParams;
    return adminResponse(
      await listRetailers(identity, parseRetailerFilters(p), p.get("cursor")),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin("retailers");
    return adminResponse(
      { id: await saveRetailer(identity, await request.json()) },
      201,
    );
  } catch (e) {
    return adminFailure(e);
  }
}
