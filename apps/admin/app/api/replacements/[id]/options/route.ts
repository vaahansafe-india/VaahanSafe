import { adminResponse, adminFailure } from "../../../../../lib/api";
import { requireAdmin } from "../../../../../lib/session";
import { replacementOptions } from "../../../../../features/replacements/server/replacements";
export async function GET(
  _r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    return adminResponse(
      await replacementOptions(
        await requireAdmin("replacements"),
        (await params).id,
      ),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
