import { getSupabaseJournalRepository } from "@vaahansafe/database";
import { requireAdmin, assertSameOrigin } from "../../../lib/session";
import { adminResponse, adminFailure } from "../../../lib/api";
import { mutateAdminArticle } from "../../../lib/journal-admin";
export async function GET() {
  try {
    await requireAdmin("articles");
    const repo = getSupabaseJournalRepository();
    const [articles, categories] = await Promise.all([
      repo.getAllArticlesForAdmin(),
      repo.getCategoriesWithCounts(),
    ]);
    return adminResponse({ articles, categories });
  } catch (error) {
    return adminFailure(error);
  }
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin("articles");
    const body = await request.json();
    return adminResponse(
      await mutateAdminArticle(
        identity,
        crypto.randomUUID(),
        body,
        "CREATE",
        body.reason,
        body.confirmed,
      ),
    );
  } catch (error) {
    return adminFailure(error);
  }
}
