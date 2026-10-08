import { requireAdmin, assertSameOrigin } from "../../../../../lib/session";
import { adminResponse, adminFailure } from "../../../../../lib/api";
import { mutateAdminArticle } from "../../../../../lib/journal-admin";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin("articles", { stepUp: true });
    const { id } = await params;
    const body = await request.json();
    return adminResponse(
      await mutateAdminArticle(
        identity,
        id,
        { status: body.publish === false ? "DRAFT" : "PUBLISHED" },
        "UPDATE",
        body.reason,
        body.confirmed,
      ),
    );
  } catch (error) {
    return adminFailure(error);
  }
}
