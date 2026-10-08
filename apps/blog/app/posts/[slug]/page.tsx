import { notFound, permanentRedirect } from "next/navigation";
import { getArticleBySlug, getPublishedArticles } from "@vaahansafe/content";

// Preserve older incoming links while serving the complete article in one place.
export function generateStaticParams() {
  return getPublishedArticles().map((article) => ({ slug: article.slug }));
}
export default async function LegacyPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const article = getArticleBySlug((await params).slug);
  if (!article) notFound();
  permanentRedirect(`/articles/${article.slug}`);
}
