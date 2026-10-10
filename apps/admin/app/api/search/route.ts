import {
  assertSameOrigin,
  requireAdmin,
  AdminError,
} from "../../../lib/session";
import { adminResponse, adminFailure } from "../../../lib/api";
import { executeOperationsSearch } from "../../../features/global-search/server/search-engine";
import type { SearchScope } from "../../../features/global-search/search.types";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin("search");
    const body = await request.json();

    if (
      typeof body.q !== "string" ||
      body.q.trim().length < 3 ||
      body.q.length > 100
    ) {
      throw new AdminError(
        400,
        "INVALID_SEARCH",
        "Enter a reference of 3–100 characters."
      );
    }

    const scope: SearchScope = body.scope || "all";
    const phone = body.phone === true;

    const data = await executeOperationsSearch(identity, body.q, scope, {
      phoneLookup: phone,
    });

    return adminResponse(data);
  } catch (error) {
    return adminFailure(error);
  }
}
