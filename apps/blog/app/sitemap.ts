import type { MetadataRoute } from "next";
import {
  canIndexSurface,
  discoveryOrigin,
  validDiscoveryDate,
} from "@vaahansafe/config";
import { getDiscoveryArticles } from "../lib/discovery";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!canIndexSurface("blog")) return [];
  const origin = discoveryOrigin("blog");
  const articles = await getDiscoveryArticles();
  const categories = [
    ...new Set(articles.map((article) => article.categorySlug).filter(Boolean)),
  ];
  return [
    ...["", "guides"].map((path) => ({
      url: `${origin}/${path}`,
      changeFrequency: "weekly" as const,
      priority: path ? 0.8 : 1,
    })),
    ...categories.map((slug) => ({
      url: `${origin}/category/${encodeURIComponent(slug)}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...articles.map((article) => ({
      url: `${origin}/articles/${encodeURIComponent(article.slug)}`,
      lastModified:
        validDiscoveryDate(article.updatedAt) ??
        validDiscoveryDate(article.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
