import "server-only";
import {
  getSupabaseAdminClient,
  mapJournalArticle,
} from "@vaahansafe/database";
import { AdminError } from "./session";
import type { AdminIdentity } from "./contracts";
export async function mutateAdminArticle(
  identity: AdminIdentity,
  id: string,
  input: Record<string, unknown>,
  mode: "CREATE" | "UPDATE" | "ARCHIVE",
  reason: string,
  confirmed: boolean,
) {
  if (identity.role !== "SUPER_ADMIN" && identity.role !== "CONTENT_EDITOR")
    throw new AdminError(403, "FORBIDDEN", "Your role cannot edit content.");
  if (
    !confirmed ||
    typeof reason !== "string" ||
    reason.trim().length < 10 ||
    reason.length > 500
  )
    throw new AdminError(
      400,
      "REASON_REQUIRED",
      "Review the change and provide a reason of 10–500 characters.",
    );
  if (!/^[\w-]{1,100}$/.test(id))
    throw new AdminError(
      400,
      "INVALID_REFERENCE",
      "Check the article reference.",
    );
  const mapping: Record<string, string> = {
    title: "title",
    slug: "slug",
    excerpt: "excerpt",
    deck: "deck",
    intro: "intro",
    category: "category",
    categorySlug: "category_slug",
    status: "status",
    readingTime: "reading_time",
    readingTimeMinutes: "reading_time_minutes",
    wordCount: "word_count",
    isFeatured: "is_featured",
    isGuide: "is_guide",
    featuredImageUrl: "featured_image_url",
    tags: "tags",
    keyTakeaways: "key_takeaways",
    body: "body",
    faq: "faq",
    references: "references_data",
    relatedSlugs: "related_slugs",
    contentMarkdown: "content_markdown",
    seoTitle: "seo_title",
    seoDescription: "seo_description",
  };
  const payload: Record<string, unknown> = {};
  for (const [key, column] of Object.entries(mapping))
    if (input[key] !== undefined) payload[column] = input[key];
  if (input.author && typeof input.author === "object") {
    const a = input.author as { name?: string; role?: string };
    payload.author_name = a.name;
    payload.author_role = a.role;
  }
  if (mode === "CREATE") {
    if (!input.title || !input.slug || !input.excerpt || !input.intro)
      throw new AdminError(
        400,
        "INVALID_CONTENT",
        "Title, URL key, excerpt and introduction are required.",
      );
    payload.category ??= "Vehicle Safety";
    payload.category_slug ??= "vehicle-safety";
    payload.status ??= "DRAFT";
  }
  if (
    payload.status &&
    !["DRAFT", "PUBLISHED", "ARCHIVED"].includes(String(payload.status))
  )
    throw new AdminError(
      400,
      "INVALID_CONTENT",
      "Choose a valid publication status.",
    );
  if (JSON.stringify(payload).length > 500000)
    throw new AdminError(
      413,
      "CONTENT_TOO_LARGE",
      "This article is too large to save in one request.",
    );
  if (
    (payload.status === "PUBLISHED" || mode === "ARCHIVE") &&
    (!identity.stepUpAt || Date.now() - Date.parse(identity.stepUpAt) > 600000)
  )
    throw new AdminError(
      403,
      "STEP_UP_REQUIRED",
      "Verify a fresh email OTP before changing public content.",
    );
  const { data, error } = await getSupabaseAdminClient().rpc(
    "admin_article_mutate",
    {
      p_session: identity.sessionId,
      p_id: id,
      p_mode: mode,
      p_values: payload,
      p_reason: reason.trim(),
      p_request: crypto.randomUUID(),
    },
  );
  if (error) throw error;
  return mapJournalArticle(data);
}
