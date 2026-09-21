import type { MetadataRoute } from "next";
import { getPublishedArticles, JOURNAL_CATEGORIES } from "@vaahansafe/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://blog.vaahansafe.com";
  const articles = getPublishedArticles();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/guides`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const categoryPages: MetadataRoute.Sitemap = JOURNAL_CATEGORIES.map(
    (category) => ({
      url: `${baseUrl}/category/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    })
  );

  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${baseUrl}/articles/${article.slug}`,
    lastModified: new Date(article.publishedAt),
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  return [...staticPages, ...categoryPages, ...articlePages];
}
