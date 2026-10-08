import { getSupabaseJournalRepository } from "@vaahansafe/database";
import { isArticlePublic } from "@vaahansafe/content";

// Discovery must reflect publication truth, including removals and future dates.
// Provider failures propagate; authored fallback content is never indexed here.
export async function getDiscoveryArticles() {
  const articles = await getSupabaseJournalRepository().getPublishedArticles();
  return articles.filter(
    (article) => isArticlePublic(article) && article.slug.trim(),
  );
}
