import {
  assertSameOrigin,
  requireAdmin,
  AdminError,
} from "../../../lib/session";
import { adminResponse, adminFailure } from "../../../lib/api";
import { searchWorkspace } from "../../../lib/operations";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin("search");
    const body = await request.json();
    if (
      typeof body.q !== "string" ||
      body.q.trim().length < 3 ||
      body.q.length > 100
    )
      throw new AdminError(
        400,
        "INVALID_SEARCH",
        "Enter a reference of 3–100 characters.",
      );
    return adminResponse(
      await searchWorkspace(identity, body.q, body.phone === true),
    );
  } catch (error) {
    return adminFailure(error);
  }
}
