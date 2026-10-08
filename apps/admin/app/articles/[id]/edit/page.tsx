import { requireAdminPage } from "../../../../lib/session";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseJournalRepository } from "@vaahansafe/database";
import { ArticleEditorForm } from "../../../../components/ArticleEditorForm";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage("articles");
  const { id } = await params;
  const repo = getSupabaseJournalRepository();
  const article = await repo.getArticleById(id);

  if (!article) {
    notFound();
  }

  const initialData = {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    deck: article.deck,
    intro: article.intro,
    category: article.category,
    categorySlug: article.categorySlug,
    status: (article.status as "DRAFT" | "PUBLISHED" | "ARCHIVED") || "DRAFT",
    authorName: article.author?.name || "Editorial Board",
    authorRole: article.author?.role || "Safety Team",
    readingTime: article.readingTime || "5 min read",
    readingTimeMinutes: article.readingTimeMinutes || 5,
    wordCount: article.wordCount || 1000,
    isFeatured: !!article.isFeatured,
    isGuide: !!article.isGuide,
    featuredImageUrl: article.featuredImageUrl || article.heroMedia?.src || "",
    tagsString: (article.tags || []).join(", "),
    keyTakeawaysString: (article.keyTakeaways || []).join("\n"),
    contentMarkdown: article.contentMarkdown || "",
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Link href="/articles" className="hover:underline">
                Articles
              </Link>
              <span>/</span>
              <span>Edit</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Article</h1>
            <p className="text-sm text-muted-foreground">
              Update editorial copy, status, and Cloudflare R2 media assets for
              &quot;{article.title}&quot;
            </p>
          </div>
        </div>

        <ArticleEditorForm initialData={initialData} isEditing={true} />
      </div>
    </>
  );
}
