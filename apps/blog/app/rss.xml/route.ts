import {
  discoveryOrigin,
  discoveryUnavailable,
  rssResponse,
} from "@vaahansafe/config";
import { getDiscoveryArticles } from "../../lib/discovery";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const origin = discoveryOrigin("blog");
    const articles = await getDiscoveryArticles();
    return rssResponse({
      title: "VaahanSafe Journal",
      description:
        "Published safety guides, vehicle identity insights, and privacy updates from VaahanSafe.",
      origin,
      items: articles.map((article) => ({
        title: article.title,
        url: `${origin}/articles/${encodeURIComponent(article.slug)}`,
        description: article.deck || article.excerpt,
        publishedAt: article.publishedAt,
        updatedAt: article.updatedAt,
        category: article.category,
        creator: article.author.name,
      })),
    });
  } catch {
    console.error("Journal RSS publication source is unavailable");
    return discoveryUnavailable();
  }
}
