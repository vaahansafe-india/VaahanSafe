import { getSupabaseJournalRepository } from "@vaahansafe/database";
import {
  requireAdmin,
  assertSameOrigin,
  AdminError,
} from "../../../../lib/session";
import { adminResponse, adminFailure } from "../../../../lib/api";
import { mutateAdminArticle } from "../../../../lib/journal-admin";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin("articles");
    const { id } = await params;
    const article = await getSupabaseJournalRepository().getArticleById(id);
    if (!article) throw new AdminError(404, "NOT_FOUND", "Article not found.");
    return adminResponse(article);
  } catch (error) {
    return adminFailure(error);
  }
}
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin("articles");
    const { id } = await params;
    const body = await request.json();
    return adminResponse(
      await mutateAdminArticle(
        identity,
        id,
        body,
        "UPDATE",
        body.reason,
        body.confirmed,
      ),
    );
  } catch (error) {
    return adminFailure(error);
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin("articles", { stepUp: true });
    const { id } = await params;
    const body = await request.json();
    await mutateAdminArticle(
      identity,
      id,
      {},
      "ARCHIVE",
      body.reason,
      body.confirmed,
    );
    return adminResponse({ archived: true });
  } catch (error) {
    return adminFailure(error);
  }
}
