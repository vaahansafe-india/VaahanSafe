import { requireAdmin } from "../../../../lib/session";
import { getAdminHealth } from "../../../../lib/operations";
import { adminResponse, adminFailure } from "../../../../lib/api";
export async function GET() {
  try {
    await requireAdmin("dashboard");
    return adminResponse(await getAdminHealth());
  } catch (error) {
    return adminFailure(error);
  }
}
