/**
 * Authoritative Journal Article Domain Model
 */

import type { BlogCategory, PublicationStatus, PublicEditorialMedia } from "../types";

export interface JournalArticleEntity {
  id: string;
  publicId: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  contentFormat: "MARKDOWN" | "JSON_BLOCKS" | "HTML";
  contentSource: string;
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
  authorId?: string;
  authorName?: string;
  authorRole?: string;
  status: PublicationStatus;
  featuredMediaId?: string;
  featuredMedia?: PublicEditorialMedia;
  readingTimeMinutes: number;
  scheduledAt?: string;
  publishedAt?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface JournalRevisionEntity {
  id: string;
  articleId: string;
  revisionNumber: number;
  titleSnapshot: string;
  excerptSnapshot?: string;
  contentSnapshot: string;
  editorId?: string;
  changeSummary?: string;
  createdAt: string;
}

export interface JournalCategoryEntity {
  id: string;
  publicId: string;
  name: BlogCategory;
  slug: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Authoritative publication eligibility rule for Journal Articles.
 *
 * An article is publicly visible IF AND ONLY IF:
 * 1. Its publication status is 'PUBLISHED'
 * 2. It has a valid publishedAt timestamp
 * 3. Its publishedAt timestamp is less than or equal to current time (now)
 */
export function isArticlePublic(
  article: { status: PublicationStatus; publishedAt?: string | null },
  now: Date = new Date()
): boolean {
  if (article.status !== "PUBLISHED") return false;
  if (!article.publishedAt) return false;
  const pubTime = new Date(article.publishedAt).getTime();
  if (Number.isNaN(pubTime)) return false;
  return pubTime <= now.getTime();
}

/**
 * Deterministic related articles scoring engine.
 *
 * Scoring factors:
 * - Same primary category: +3 points
 * - Shared tags: +2 points per shared tag
 * - Recency: +1 point if published within past 30 days
 *
 * Strictly filters out:
 * - The source/target article itself
 * - Unpublished / draft / scheduled / archived articles
 */
export function scoreRelatedArticles<
  T extends {
    slug: string;
    categorySlug: string;
    tags: readonly string[];
    publishedAt: string;
    status: PublicationStatus;
  }
>(
  targetArticle: T,
  candidates: readonly T[],
  limit = 3,
  now: Date = new Date()
): T[] {
  const targetTags = new Set(targetArticle.tags.map((t) => t.toLowerCase()));
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  const scored = candidates
    .filter((candidate) => {
      if (candidate.slug === targetArticle.slug) return false;
      return isArticlePublic(candidate, now);
    })
    .map((candidate) => {
      let score = 0;

      // 1. Same primary category: +3
      if (candidate.categorySlug === targetArticle.categorySlug) {
        score += 3;
      }

      // 2. Shared tags: +2 per tag
      for (const tag of candidate.tags) {
        if (targetTags.has(tag.toLowerCase())) {
          score += 2;
        }
      }

      // 3. Recency: +1 if within 30 days
      const candidateTime = new Date(candidate.publishedAt).getTime();
      if (!Number.isNaN(candidateTime) && now.getTime() - candidateTime <= thirtyDaysMs) {
        score += 1;
      }

      return { candidate, score, publishedAt: candidateTime || 0 };
    });

  // Sort deterministically: highest score first, then newest published date, then slug alphabetically
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.publishedAt !== a.publishedAt) return b.publishedAt - a.publishedAt;
    return a.candidate.slug.localeCompare(b.candidate.slug);
  });

  return scored.slice(0, limit).map((s) => s.candidate);
}

