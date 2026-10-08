import { requireAdminPage } from "../../lib/session";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
} from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";
import { getSupabaseJournalRepository } from "@vaahansafe/database";
import { ArticlesTableClient } from "./table-client";

import type { BlogPost } from "@vaahansafe/content";

export const revalidate = 0; // Dynamic server page

export default async function AdminArticlesPage() {
  await requireAdminPage("articles");
  const repo = getSupabaseJournalRepository();
  let articles: BlogPost[] = [];
  let categories: Array<{
    id: string;
    slug: string;
    name: string;
    count: number;
  }> = [];
  let errorMsg = null;

  try {
    [articles, categories] = await Promise.all([
      repo.getAllArticlesForAdmin(),
      repo.getCategoriesWithCounts(),
    ]);
  } catch (err: unknown) {
    console.error("[AdminArticlesPage] Editorial records unavailable", {
      errorType: err instanceof Error ? err.name : "Unknown",
    });
    errorMsg =
      "We couldn't load the editorial workspace right now. Please try again.";
  }

  const publishedCount = articles.filter(
    (a) => a.status === "PUBLISHED",
  ).length;
  const draftCount = articles.filter((a) => a.status === "DRAFT").length;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="admin-page-heading">
          <div>
            <div className="admin-eyebrow">Platform / Content</div>
            <h1>Editorial workspace</h1>
            <p className="text-sm text-muted-foreground">
              Manage Journal publications, safety guides and editorial media.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/articles/new">
              <Button className="admin-button primary">+ New Article</Button>
            </Link>
          </div>
        </div>

        {errorMsg && <div className="admin-notice error">{errorMsg}</div>}

        {/* Quick Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Articles
              </CardTitle>
              <VaahanIcon
                name="file"
                size={16}
                className="text-muted-foreground"
              />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">
                {errorMsg ? "—" : articles.length}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {errorMsg ? "Temporarily unavailable" : "Editorial library"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Published
              </CardTitle>
              <VaahanIcon name="check" size={16} className="text-emerald-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-emerald-600">
                {errorMsg ? "—" : publishedCount}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Live on blog.vaahansafe.com
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Drafts
              </CardTitle>
              <VaahanIcon
                name="activity"
                size={16}
                className="text-amber-500"
              />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-amber-600">
                {errorMsg ? "—" : draftCount}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Unpublished editorial drafts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Cloudflare R2 Media
              </CardTitle>
              <VaahanIcon name="server" size={16} className="text-sky-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-sm text-muted-foreground">
                R2 media catalog
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                assets.vaahansafe.com
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Client Table */}
        {!errorMsg && (
          <ArticlesTableClient
            initialArticles={articles}
            categories={categories}
          />
        )}
      </div>
    </>
  );
}
