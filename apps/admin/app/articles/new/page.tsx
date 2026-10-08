import { requireAdminPage } from "../../../lib/session";
import Link from "next/link";
import { ArticleEditorForm } from "../../../components/ArticleEditorForm";

export default async function NewArticlePage() {
  await requireAdminPage("articles");
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
              <span>New</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Create New Article
            </h1>
            <p className="text-sm text-muted-foreground">
              Add a new article or safety guide to VaahanSafe Journal with
              Cloudflare R2 images
            </p>
          </div>
        </div>

        <ArticleEditorForm isEditing={false} />
      </div>
    </>
  );
}
