import { BlogPost, JournalCategoryInfo } from "./types";
import { JOURNAL_CATEGORIES } from "./categories";
import { PUBLISHED_ARTICLES } from "./articles";
import { scoreRelatedArticles, isArticlePublic } from "./domain/article";

export interface CategoryWithCount extends JournalCategoryInfo {
  count: number;
}

export interface CategoryWithLatest extends CategoryWithCount {
  latestArticleTitle?: string;
  latestArticleSlug?: string;
}

export interface JournalLandingData {
  featuredStory: BlogPost;
  leadStory: BlogPost;
  verticalStory: BlogPost;
  textStory: BlogPost;
  spotlightStory: BlogPost;
  darkChapterStory?: BlogPost;
  practicalGuides: readonly BlogPost[];
  indexStories: readonly BlogPost[];
  signalCategories: readonly CategoryWithLatest[];
}

/**
 * Returns all Journal categories enriched with real published article counts.
 * Strictly non-hardcoded counts.
 */
export function getJournalCategories(): readonly CategoryWithCount[] {
  return JOURNAL_CATEGORIES.map((cat) => {
    const count = PUBLISHED_ARTICLES.filter(
      (a) => a.status === "PUBLISHED" && a.categorySlug === cat.slug
    ).length;
    return {
      ...cat,
      count,
    };
  });
}

/**
 * Resolves a category by its URL slug.
 */
export function getCategoryBySlug(slug: string): CategoryWithCount | undefined {
  const categories = getJournalCategories();
  return categories.find((c) => c.slug === slug);
}

/**
 * Returns all published articles sorted by publication date (descending).
 * Drafts and archived items are strictly excluded from public consumption.
 */
export function getPublishedArticles(now: Date = new Date()): readonly BlogPost[] {
  return [...PUBLISHED_ARTICLES]
    .filter((a) => isArticlePublic(a, now))
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
}

/**
 * Resolves the primary featured story for the Journal.
 */
export function getFeaturedArticle(): BlogPost {
  const published = getPublishedArticles();
  return (
    published.find((a) => a.isFeatured) ||
    published[0] ||
    PUBLISHED_ARTICLES[0]!
  );
}

/**
 * Resolves a single published article by its unique URL slug.
 */
export function getArticleBySlug(slug: string, now: Date = new Date()): BlogPost | undefined {
  return PUBLISHED_ARTICLES.find(
    (a) => a.slug === slug && isArticlePublic(a, now)
  );
}

/**
 * Returns all published articles belonging to a specific category slug.
 */
export function getArticlesByCategory(categorySlug: string): readonly BlogPost[] {
  return getPublishedArticles().filter((a) => a.categorySlug === categorySlug);
}

/**
 * Returns all published long-form safety guides.
 */
export function getPublishedGuides(): readonly BlogPost[] {
  return getPublishedArticles().filter(
    (a) => a.isGuide || a.categorySlug === "safety-guides"
  );
}

/**
 * Searches published articles across title, excerpt, deck, intro, body text, tags, and author.
 */
export function searchArticles(query: string): readonly BlogPost[] {
  const clean = query.trim().toLowerCase();
  if (!clean) {
    return getPublishedArticles();
  }

  return getPublishedArticles().filter((article) => {
    if (article.title.toLowerCase().includes(clean)) return true;
    if (article.excerpt.toLowerCase().includes(clean)) return true;
    if (article.deck?.toLowerCase().includes(clean)) return true;
    if (article.intro.toLowerCase().includes(clean)) return true;
    if (article.tags.some((t) => t.toLowerCase().includes(clean))) return true;
    if (article.author.name.toLowerCase().includes(clean)) return true;
    if (article.category.toLowerCase().includes(clean)) return true;

    // Search section headings & paragraphs
    for (const section of article.body) {
      if (section.heading?.toLowerCase().includes(clean)) return true;
      if (section.paragraphs.some((p) => p.toLowerCase().includes(clean))) {
        return true;
      }
      if (section.callout?.text.toLowerCase().includes(clean)) return true;
    }

    return false;
  });
}

/**
 * Returns related articles for a given article, preserving content relationships.
 * Leverages deterministic scoring (same category, shared tags, recency) while strictly
 * preserving publication gating and excluding the current article.
 */
export function getRelatedArticles(slug: string, limit = 3): readonly BlogPost[] {
  const current = getArticleBySlug(slug);
  if (!current) return [];

  const bySlug = current.relatedSlugs
    .map((rSlug) => getArticleBySlug(rSlug))
    .filter((p): p is BlogPost => Boolean(p));

  if (bySlug.length >= limit) {
    return bySlug.slice(0, limit);
  }

  // Use deterministic related articles scoring for remaining quota
  const allCandidates = getPublishedArticles();
  const scored = scoreRelatedArticles(current, allCandidates, limit * 2);
  const remaining = scored.filter((s) => !bySlug.some((b) => b.slug === s.slug));

  return [...bySlug, ...remaining].slice(0, limit);
}

/**
 * Returns the latest stream of articles, optionally excluding a featured slug.
 */
export function getLatestArticles(excludeSlug?: string, limit = 5): readonly BlogPost[] {
  const published = getPublishedArticles();
  const filtered = excludeSlug
    ? published.filter((a) => a.slug !== excludeSlug)
    : published;
  return filtered.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Backwards Compatibility Aliases
// ---------------------------------------------------------------------------
export function getAllBlogPosts(): readonly BlogPost[] {
  return getPublishedArticles();
}

export function getFeaturedBlogPost(): BlogPost {
  return getFeaturedArticle();
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return getArticleBySlug(slug);
}

export function getBlogPostsByCategory(category: string): BlogPost[] {
  if (!category || category === "All") {
    return [...getPublishedArticles()];
  }
  return [...getPublishedArticles()].filter(
    (a) => a.category === category || a.categorySlug === category
  );
}

export function getRelatedBlogPosts(slug: string, limit = 2): BlogPost[] {
  return [...getRelatedArticles(slug, limit)];
}

/**
 * Returns full-width deterministic editorial landing data.
 * Supports optional dynamic placement overrides from Cloudflare D1 journal_placements.
 */
export function getJournalLandingData(
  placements?: Record<string, { slug: string } | string>
): JournalLandingData {
  const published = getPublishedArticles();

  // 1. Resolve HERO placement
  const heroSlug = typeof placements?.HERO === "string" ? placements.HERO : placements?.HERO?.slug;
  const featured = (heroSlug && getArticleBySlug(heroSlug)) || getFeaturedArticle();

  const remainingAfterFeatured = published.filter((a) => a.slug !== featured.slug);

  // 2. Resolve LEAD placement
  const leadSlug = typeof placements?.LEAD === "string" ? placements.LEAD : placements?.LEAD?.slug;
  const leadStory = (leadSlug && getArticleBySlug(leadSlug)) || remainingAfterFeatured[0] || featured;

  // 3. Resolve SECONDARY / Vertical placement
  const secondarySlug =
    typeof placements?.SECONDARY === "string" ? placements.SECONDARY : placements?.SECONDARY?.slug;
  const verticalStory =
    (secondarySlug && getArticleBySlug(secondarySlug)) ||
    remainingAfterFeatured.find((a) => a.slug === "dual-layer-identity-architecture") ||
    remainingAfterFeatured.find((a) => a.slug === "emergency-contact-relays") ||
    remainingAfterFeatured[1] ||
    featured;

  // 4. Resolve Text Story placement
  const textStory =
    remainingAfterFeatured.find((a) => a.slug === "good-samaritan-law-india") ||
    remainingAfterFeatured[2] ||
    featured;

  // 4b. Resolve DARK_CHAPTER placement
  const darkChapterSlug =
    typeof placements?.DARK_CHAPTER === "string"
      ? placements.DARK_CHAPTER
      : placements?.DARK_CHAPTER?.slug;
  const darkChapterStory =
    (darkChapterSlug && getArticleBySlug(darkChapterSlug)) ||
    remainingAfterFeatured.find((a) => a.slug === "optical-contrast-automotive-glazing") ||
    undefined;

  // 5. Resolve PRIVACY_SPOTLIGHT placement
  const spotlightSlug =
    typeof placements?.PRIVACY_SPOTLIGHT === "string"
      ? placements.PRIVACY_SPOTLIGHT
      : placements?.PRIVACY_SPOTLIGHT?.slug;
  const spotlightStory =
    (spotlightSlug && getArticleBySlug(spotlightSlug)) ||
    remainingAfterFeatured.find((a) => a.slug === "separating-contacts-from-address") ||
    remainingAfterFeatured[3] ||
    featured;

  // 6. Resolve GUIDE_FEATURE placement
  const guideSlug =
    typeof placements?.GUIDE_FEATURE === "string"
      ? placements.GUIDE_FEATURE
      : placements?.GUIDE_FEATURE?.slug;
  const preferredGuide = guideSlug && getArticleBySlug(guideSlug);
  const baseGuides = getPublishedGuides();
  const practicalGuides = preferredGuide
    ? [preferredGuide, ...baseGuides.filter((g) => g.slug !== preferredGuide.slug)].slice(0, 3)
    : baseGuides.slice(0, 3);

  const usedSlugs = new Set([
    featured.slug,
    leadStory.slug,
    verticalStory.slug,
    textStory.slug,
  ]);
  const indexStories = published.filter((a) => !usedSlugs.has(a.slug)).slice(0, 5);

  const categories = getJournalCategories();
  const signalCategories: CategoryWithLatest[] = categories
    .filter((c) => c.slug !== "all")
    .map((cat) => {
      const latestInCat = published.find((a) => a.categorySlug === cat.slug);
      return {
        ...cat,
        latestArticleTitle: latestInCat?.title,
        latestArticleSlug: latestInCat?.slug,
      };
    });

  return {
    featuredStory: featured,
    leadStory,
    verticalStory,
    textStory,
    spotlightStory,
    darkChapterStory,
    practicalGuides,
    indexStories: indexStories.length > 0 ? indexStories : remainingAfterFeatured.slice(0, 4),
    signalCategories,
  };
}

