import { adminResponse, adminFailure } from "../../../lib/api";
import { requireAdmin, AdminError } from "../../../lib/session";
import directory from "../../../features/geography/india-directory.json";
export async function GET(request: Request) {
  try {
    await requireAdmin("retailers");
    const state = new URL(request.url).searchParams.get("state");
    if (state !== null && !directory.states.some((s) => s.code === state))
      throw new AdminError(
        400,
        "INVALID_STATE",
        "Select a recognized state or union territory.",
      );
    return adminResponse(
      state
        ? directory.districts
            .filter((d) => d.state_code === state)
            .map(({ code, name }) => ({ code, name }))
        : directory.states,
    );
  } catch (e) {
    return adminFailure(e);
  }
}
