import {
  getPublishedArticles as getStaticPublishedArticles,
  getArticleBySlug as getStaticArticleBySlug,
  getJournalCategories as getStaticCategories,
  getJournalLandingData,
  scoreRelatedArticles,
  BlogPost,
  BlogCategory,
  CategoryWithCount,
} from "@vaahansafe/content";
import { getSupabaseJournalRepository } from "@vaahansafe/database";

/**
 * Authoritative Dynamic Journal Content Service
 * Connects to Supabase PostgreSQL (source of truth) with seamless fallback
 * to canonical authored content when database services are cold.
 */

export async function getLivePublishedArticles(): Promise<readonly BlogPost[]> {
  try {
    const repo = getSupabaseJournalRepository();
    const live = await repo.getPublishedArticles();
    if (live && live.length > 0) {
      return live;
    }
  } catch (err) {
    console.warn("[Journal] Falling back to static articles:", err instanceof Error ? err.message : String(err));
  }
  return getStaticPublishedArticles();
}

export async function getLiveArticleBySlug(slug: string): Promise<BlogPost | undefined> {
  const cleanSlug = slug.trim().toLowerCase();
  try {
    const repo = getSupabaseJournalRepository();
    const live = await repo.getArticleBySlug(cleanSlug);
    if (live && live.status === "PUBLISHED") {
      return live;
    }
  } catch (err) {
    console.warn(`[Journal] Falling back to static article for "${cleanSlug}":`, err instanceof Error ? err.message : String(err));
  }
  return getStaticArticleBySlug(cleanSlug);
}

export async function getLiveCategories(): Promise<readonly CategoryWithCount[]> {
  try {
    const repo = getSupabaseJournalRepository();
    const liveCats = await repo.getCategoriesWithCounts();
    if (liveCats && liveCats.length > 0) {
      return liveCats.map((c) => ({
        name: c.name as BlogCategory,
        slug: c.slug,
        indexNumber: c.indexNumber,
        description: c.description || "",
        headline: c.headline || "",
        spotlightDeck: c.spotlightDeck || undefined,
        iconName: c.iconName || undefined,
        order: c.orderNum,
        count: c.count,
      }));
    }
  } catch (err) {
    console.warn("[Journal] Falling back to static categories:", err instanceof Error ? err.message : String(err));
  }
  return getStaticCategories();
}

export async function getLiveArticlesByCategory(categorySlug: string): Promise<readonly BlogPost[]> {
  const articles = await getLivePublishedArticles();
  return articles.filter((a) => a.categorySlug === categorySlug);
}

export async function getLiveGuides(): Promise<readonly BlogPost[]> {
  const articles = await getLivePublishedArticles();
  return articles.filter((a) => a.isGuide || a.categorySlug === "safety-guides");
}

export async function searchLiveArticles(query: string): Promise<readonly BlogPost[]> {
  const clean = query.trim().toLowerCase();
  if (!clean) return getLivePublishedArticles();

  try {
    const repo = getSupabaseJournalRepository();
    const results = await repo.searchPublishedArticles(clean);
    if (results && results.length > 0) return results;
  } catch (err) {
    console.warn("[Journal] Falling back to memory search:", err);
  }

  const all = await getLivePublishedArticles();
  return all.filter((a) => {
    return (
      a.title.toLowerCase().includes(clean) ||
      a.excerpt.toLowerCase().includes(clean) ||
      a.intro.toLowerCase().includes(clean) ||
      a.tags.some((t) => t.toLowerCase().includes(clean)) ||
      a.author.name.toLowerCase().includes(clean)
    );
  });
}

export async function getLiveRelatedArticles(slug: string, limit = 3): Promise<readonly BlogPost[]> {
  const current = await getLiveArticleBySlug(slug);
  if (!current) return [];

  const all = await getLivePublishedArticles();

  // Explicit related slugs
  const bySlug = current.relatedSlugs
    .map((rSlug) => all.find((a) => a.slug === rSlug))
    .filter((p): p is BlogPost => Boolean(p));

  if (bySlug.length >= limit) {
    return bySlug.slice(0, limit);
  }

  const scored = scoreRelatedArticles(current, all, limit * 2);
  const remaining = scored.filter((s) => !bySlug.some((b) => b.slug === s.slug));

  return [...bySlug, ...remaining].slice(0, limit);
}
