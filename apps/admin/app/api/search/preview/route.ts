import { requireAdmin, AdminError } from "../../../../lib/session";
import { adminResponse, adminFailure } from "../../../../lib/api";
import { getEntityPreview } from "../../../../features/global-search/server/search-preview";
import type { SearchScope } from "../../../../features/global-search/search.types";

export async function GET(request: Request) {
  try {
    const identity = await requireAdmin("search");
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as SearchScope | null;
    const id = searchParams.get("id");

    if (!type || !id) {
      throw new AdminError(400, "INVALID_REQUEST", "Entity type and id are required.");
    }

    const data = await getEntityPreview(identity, type, id);
    return adminResponse(data);
  } catch (error) {
    return adminFailure(error);
  }
}
