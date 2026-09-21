/**
 * D1 Journal Content Repository Implementation
 *
 * Implements the authoritative Cloudflare D1 persistence for the VaahanSafe Journal.
 * Handles public read-only publishing queries and future Admin CMS command operations.
 *
 * INVARIANTS:
 * 1. Cloudflare D1 is the relational source of truth for all content metadata.
 * 2. Binary assets reside in Cloudflare R2; zero binaries in D1.
 * 3. Draft and scheduled articles are strictly filtered out from public queries.
 * 4. Slugs are normalized, unique, and changes are recorded in slug history for 301 redirects.
 * 5. Article mutations automatically generate versioned revision snapshots.
 */

import type { DatabaseClient } from "../client/d1";

export type JournalPublicationStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";

export interface DbJournalCategoryRow {
  id: string;
  public_id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface DbJournalAuthorRow {
  id: string;
  public_id: string;
  display_name: string;
  slug: string;
  bio: string | null;
  avatar_media_id: string | null;
  role_label: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface DbJournalMediaRow {
  id: string;
  public_id: string;
  storage_key: string;
  media_asset_id: string | null;
  mime_type: string;
  width: number | null;
  height: number | null;
  file_size: number | null;
  alt_text: string | null;
  caption: string | null;
  focal_x: number;
  focal_y: number;
  frame_type: string;
  created_by: string | null;
  created_at: string;
}

export interface DbJournalArticleRow {
  id: string;
  public_id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  content_format: string;
  content_source: string;
  category_id: string | null;
  author_id: string | null;
  status: JournalPublicationStatus;
  featured_media_id: string | null;
  og_media_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  reading_time_minutes: number;
  scheduled_at: string | null;
  published_at: string | null;
  version: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;

  // Joined fields
  category_name?: string;
  category_slug?: string;
  author_name?: string;
  author_role?: string;
  media_storage_key?: string;
  media_alt_text?: string;
  media_caption?: string;
  media_frame_type?: string;
  media_focal_x?: number;
  media_focal_y?: number;
  thumbnail_storage_key?: string;
  thumbnail_alt_text?: string;
  thumbnail_caption?: string;
  thumbnail_frame_type?: string;
  thumbnail_focal_x?: number;
  thumbnail_focal_y?: number;
}

export interface DbJournalPlacementRow {
  id: string;
  slot: string;
  article_id: string;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbJournalRevisionRow {
  id: string;
  article_id: string;
  revision_number: number;
  title_snapshot: string;
  excerpt_snapshot: string | null;
  content_snapshot: string;
  editor_id: string | null;
  change_summary: string | null;
  created_at: string;
}

export interface DbJournalSlugHistoryRow {
  id: string;
  article_id: string;
  old_slug: string;
  created_at: string;
}

export interface PublicArticleResult {
  id: string;
  publicId: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  contentFormat: string;
  contentSource: string;
  status: JournalPublicationStatus;
  category: {
    name: string;
    slug: string;
  };
  author: {
    name: string;
    role: string;
  };
  media?: {
    storageKey: string;
    url?: string;
    altText?: string;
    caption?: string;
    frameType?: string;
    focalPoint?: {
      x: number;
      y: number;
    };
  };
  thumbnail?: {
    storageKey: string;
    url?: string;
    altText?: string;
    caption?: string;
    frameType?: string;
    focalPoint?: {
      x: number;
      y: number;
    };
  };
  tags?: string[];
  readingTimeMinutes: number;
  publishedAt: string;
  version: number;
}

export interface MediaUsageResult {
  articleId: string;
  articleTitle: string;
  articleSlug: string;
  role: string;
}

const ARTICLE_BASE_SELECT = `
  a.id, a.public_id, a.slug, a.title, a.subtitle, a.excerpt,
  a.content_format, a.content_source, a.status, a.reading_time_minutes,
  a.published_at, a.version,
  c.name as category_name, c.slug as category_slug,
  u.display_name as author_name, u.role_label as author_role,
  COALESCE(m_hero.storage_key, m_feat.storage_key) as media_storage_key,
  COALESCE(m_hero.alt_text, m_feat.alt_text) as media_alt_text,
  COALESCE(m_hero.caption, m_feat.caption) as media_caption,
  COALESCE(m_hero.frame_type, m_feat.frame_type) as media_frame_type,
  COALESCE(m_hero.focal_x, m_feat.focal_x, 50) as media_focal_x,
  COALESCE(m_hero.focal_y, m_feat.focal_y, 50) as media_focal_y,
  m_thumb.storage_key as thumbnail_storage_key,
  m_thumb.alt_text as thumbnail_alt_text,
  m_thumb.caption as thumbnail_caption,
  m_thumb.frame_type as thumbnail_frame_type,
  COALESCE(m_thumb.focal_x, 50) as thumbnail_focal_x,
  COALESCE(m_thumb.focal_y, 50) as thumbnail_focal_y
`;

const ARTICLE_BASE_JOINS = `
  LEFT JOIN journal_categories c ON a.category_id = c.id
  LEFT JOIN journal_authors u ON a.author_id = u.id
  LEFT JOIN journal_article_media jam_hero ON a.id = jam_hero.article_id AND jam_hero.role = 'HERO' AND jam_hero.display_order = 0
  LEFT JOIN journal_media m_hero ON jam_hero.media_id = m_hero.id
  LEFT JOIN journal_media m_feat ON a.featured_media_id = m_feat.id
  LEFT JOIN journal_article_media jam_thumb ON a.id = jam_thumb.article_id AND jam_thumb.role = 'THUMBNAIL' AND jam_thumb.display_order = 0
  LEFT JOIN journal_media m_thumb ON jam_thumb.media_id = m_thumb.id
`;

export class D1JournalRepository {
  constructor(private db: DatabaseClient) {}

  // --------------------------------------------------------------------------
  // PUBLIC READ QUERIES (Used by blog.vaahansafe.com)
  // --------------------------------------------------------------------------

  /**
   * Retrieves a single published article by its canonical slug.
   * INVARIANT: Only status='PUBLISHED' and published_at <= current time are returned.
   */
  async getPublishedArticleBySlug(slug: string): Promise<PublicArticleResult | null> {
    const cleanSlug = slug.trim().toLowerCase();
    const query = `
      SELECT 
        ${ARTICLE_BASE_SELECT}
      FROM journal_articles a
      ${ARTICLE_BASE_JOINS}
      WHERE a.slug = ?
        AND a.status = 'PUBLISHED'
        AND (a.published_at IS NULL OR datetime(a.published_at) <= datetime('now'))
    `;

    const row = await this.db.queryFirst<DbJournalArticleRow>(query, [cleanSlug]);
    if (!row) return null;

    return this.mapArticleRow(row);
  }

  /**
   * Checks if an old slug exists in slug history for 301 redirection.
   */
  async resolveSlugRedirect(oldSlug: string): Promise<string | null> {
    const cleanOldSlug = oldSlug.trim().toLowerCase();
    const query = `
      SELECT a.slug
      FROM journal_article_slug_history h
      JOIN journal_articles a ON h.article_id = a.id
      WHERE h.old_slug = ? AND a.status = 'PUBLISHED'
    `;
    const row = await this.db.queryFirst<{ slug: string }>(query, [cleanOldSlug]);
    return row ? row.slug : null;
  }

  /**
   * Lists all published articles in descending publication order.
   */
  async getPublishedArticles(limit = 20, offset = 0): Promise<PublicArticleResult[]> {
    const query = `
      SELECT 
        ${ARTICLE_BASE_SELECT}
      FROM journal_articles a
      ${ARTICLE_BASE_JOINS}
      WHERE a.status = 'PUBLISHED'
        AND (a.published_at IS NULL OR datetime(a.published_at) <= datetime('now'))
      ORDER BY a.published_at DESC
      LIMIT ? OFFSET ?
    `;

    const rows = await this.db.query<DbJournalArticleRow>(query, [limit, offset]);
    return rows.map((r) => this.mapArticleRow(r));
  }

  /**
   * Lists published articles filtered by category slug.
   */
  async getPublishedArticlesByCategory(
    categorySlug: string,
    limit = 20
  ): Promise<PublicArticleResult[]> {
    const cleanSlug = categorySlug.trim().toLowerCase();
    const query = `
      SELECT 
        ${ARTICLE_BASE_SELECT}
      FROM journal_articles a
      ${ARTICLE_BASE_JOINS}
      WHERE c.slug = ?
        AND a.status = 'PUBLISHED'
        AND (a.published_at IS NULL OR datetime(a.published_at) <= datetime('now'))
      ORDER BY a.published_at DESC
      LIMIT ?
    `;

    const rows = await this.db.query<DbJournalArticleRow>(query, [cleanSlug, limit]);
    return rows.map((r) => this.mapArticleRow(r));
  }

  /**
   * Searches published articles across title, excerpt, and content source.
   * INVARIANT: Never leaks drafts or scheduled articles.
   */
  async searchPublishedArticles(searchTerm: string, limit = 10): Promise<PublicArticleResult[]> {
    const cleanTerm = searchTerm.trim().toLowerCase();
    if (!cleanTerm) return this.getPublishedArticles(limit);

    const query = `
      SELECT 
        ${ARTICLE_BASE_SELECT}
      FROM journal_articles a
      ${ARTICLE_BASE_JOINS}
      WHERE a.status = 'PUBLISHED'
        AND (a.published_at IS NULL OR datetime(a.published_at) <= datetime('now'))
        AND (
          LOWER(a.title) LIKE ? OR
          LOWER(a.excerpt) LIKE ? OR
          LOWER(a.content_source) LIKE ? OR
          LOWER(c.name) LIKE ?
        )
      ORDER BY a.published_at DESC
      LIMIT ?
    `;

    const pattern = `%${cleanTerm}%`;
    const rows = await this.db.query<DbJournalArticleRow>(query, [
      pattern,
      pattern,
      pattern,
      pattern,
      limit,
    ]);
    return rows.map((r) => this.mapArticleRow(r));
  }

  /**
   * Retrieves active placements for the Journal Homepage.
   * Resolves: HERO, LEAD, SECONDARY, PRIVACY_SPOTLIGHT, GUIDE_FEATURE, DARK_CHAPTER.
   */
  async getHomepagePlacements(): Promise<Record<string, PublicArticleResult>> {
    const query = `
      SELECT 
        p.slot,
        ${ARTICLE_BASE_SELECT}
      FROM journal_placements p
      JOIN journal_articles a ON p.article_id = a.id
      ${ARTICLE_BASE_JOINS}
      WHERE a.status = 'PUBLISHED'
        AND (a.published_at IS NULL OR datetime(a.published_at) <= datetime('now'))
        AND (p.starts_at IS NULL OR datetime(p.starts_at) <= datetime('now'))
        AND (p.ends_at IS NULL OR datetime(p.ends_at) >= datetime('now'))
      ORDER BY p.priority ASC
    `;

    const rows = await this.db.query<DbJournalArticleRow & { slot: string }>(query);
    const result: Record<string, PublicArticleResult> = {};
    for (const row of rows) {
      if (!result[row.slot]) {
        result[row.slot] = this.mapArticleRow(row);
      }
    }
    return result;
  }

  /**
   * Retrieves all active categories with published article counts.
   */
  async getCategoriesWithCounts(): Promise<
    Array<{
      id: string;
      publicId: string;
      name: string;
      slug: string;
      description: string | null;
      sortOrder: number;
      articleCount: number;
    }>
  > {
    const query = `
      SELECT 
        c.id, c.public_id, c.name, c.slug, c.description, c.sort_order,
        COUNT(a.id) as article_count
      FROM journal_categories c
      LEFT JOIN journal_articles a ON c.id = a.category_id 
        AND a.status = 'PUBLISHED' 
        AND (a.published_at IS NULL OR datetime(a.published_at) <= datetime('now'))
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY c.sort_order ASC
    `;

    const rows = await this.db.query<
      DbJournalCategoryRow & { article_count: number }
    >(query);

    return rows.map((r) => ({
      id: r.id,
      publicId: r.public_id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      sortOrder: r.sort_order,
      articleCount: Number(r.article_count || 0),
    }));
  }

  /**
   * Retrieves tag names assigned to an article.
   */
  async getArticleTags(articleId: string): Promise<string[]> {
    const query = `
      SELECT t.name
      FROM journal_article_tags at
      JOIN journal_tags t ON at.tag_id = t.id
      WHERE at.article_id = ?
    `;
    const rows = await this.db.query<{ name: string }>(query, [articleId]);
    return rows.map((r) => r.name);
  }

  /**
   * Retrieves deterministic related articles for a given article slug.
   * INVARIANT: Never uses Math.random(). Prioritizes same category, then recent published.
   */
  async getRelatedArticles(slug: string, limit = 2): Promise<PublicArticleResult[]> {
    const current = await this.getPublishedArticleBySlug(slug);
    if (!current) return [];

    const query = `
      SELECT 
        ${ARTICLE_BASE_SELECT}
      FROM journal_articles a
      ${ARTICLE_BASE_JOINS}
      WHERE a.status = 'PUBLISHED'
        AND a.slug != ?
        AND (a.published_at IS NULL OR datetime(a.published_at) <= datetime('now'))
        AND c.slug = ?
      ORDER BY a.published_at DESC
      LIMIT ?
    `;

    const rows = await this.db.query<DbJournalArticleRow>(query, [slug, current.category.slug, limit]);
    const results = rows.map((r) => this.mapArticleRow(r));
    if (results.length >= limit) return results;

    const remaining = limit - results.length;
    const fallbackQuery = `
      SELECT 
        ${ARTICLE_BASE_SELECT}
      FROM journal_articles a
      ${ARTICLE_BASE_JOINS}
      WHERE a.status = 'PUBLISHED'
        AND a.slug != ?
        AND (a.published_at IS NULL OR datetime(a.published_at) <= datetime('now'))
        AND a.id NOT IN (${[current.id, ...results.map((r) => `'${r.id}'`)].join(",")})
      ORDER BY a.published_at DESC
      LIMIT ?
    `;

    const fallbackRows = await this.db.query<DbJournalArticleRow>(fallbackQuery, [slug, remaining]);
    return [...results, ...fallbackRows.map((r) => this.mapArticleRow(r))];
  }

  /**
   * Retrieves revision history for an article (for future admin inspection/rollback).
   */
  async getArticleRevisions(articleId: string): Promise<
    Array<{
      id: string;
      revisionNumber: number;
      titleSnapshot: string;
      excerptSnapshot?: string;
      contentSnapshot: string;
      editorId?: string;
      changeSummary?: string;
      createdAt: string;
    }>
  > {
    const query = `
      SELECT id, revision_number, title_snapshot, excerpt_snapshot, content_snapshot, editor_id, change_summary, created_at
      FROM journal_article_revisions
      WHERE article_id = ?
      ORDER BY revision_number DESC
    `;
    const rows = await this.db.query<DbJournalRevisionRow>(query, [articleId]);
    return rows.map((r) => ({
      id: r.id,
      revisionNumber: r.revision_number,
      titleSnapshot: r.title_snapshot,
      excerptSnapshot: r.excerpt_snapshot || undefined,
      contentSnapshot: r.content_snapshot,
      editorId: r.editor_id || undefined,
      changeSummary: r.change_summary || undefined,
      createdAt: r.created_at,
    }));
  }

  // --------------------------------------------------------------------------
  // FUTURE ADMIN CMS COMMANDS (For admin.vaahansafe.com)
  // --------------------------------------------------------------------------

  /**
   * Creates a new draft article and registers revision 1.
   */
  async createArticle(input: {
    title: string;
    slug: string;
    excerpt?: string;
    subtitle?: string;
    contentSource: string;
    categoryId?: string;
    authorId?: string;
    featuredMediaId?: string;
    editorId?: string;
    readingTimeMinutes?: number;
  }): Promise<{ id: string; publicId: string; slug: string }> {
    const id = `jart_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const publicId = `art_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
    const slug = input.slug.trim().toLowerCase();
    const now = new Date().toISOString();

    await this.db.execute(
      `INSERT INTO journal_articles (
        id, public_id, slug, title, subtitle, excerpt,
        content_format, content_source, category_id, author_id,
        status, featured_media_id, reading_time_minutes, version,
        created_by, updated_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'MARKDOWN', ?, ?, ?, 'DRAFT', ?, ?, 1, ?, ?, ?, ?)`,
      [
        id,
        publicId,
        slug,
        input.title,
        input.subtitle || null,
        input.excerpt || null,
        input.contentSource,
        input.categoryId || null,
        input.authorId || null,
        input.featuredMediaId || null,
        input.readingTimeMinutes || 5,
        input.editorId || null,
        input.editorId || null,
        now,
        now,
      ]
    );

    // Initial revision snapshot
    const revId = `jrev_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    await this.db.execute(
      `INSERT INTO journal_article_revisions (
        id, article_id, revision_number, title_snapshot, excerpt_snapshot,
        content_snapshot, editor_id, change_summary, created_at
      ) VALUES (?, ?, 1, ?, ?, ?, ?, 'Article created', ?)`,
      [
        revId,
        id,
        input.title,
        input.excerpt || null,
        input.contentSource,
        input.editorId || null,
        now,
      ]
    );

    return { id, publicId, slug };
  }

  /**
   * Updates an existing article and records an automatic revision snapshot.
   */
  async updateArticle(
    id: string,
    input: {
      title?: string;
      subtitle?: string;
      excerpt?: string;
      contentSource?: string;
      categoryId?: string;
      featuredMediaId?: string;
      editorId?: string;
      readingTimeMinutes?: number;
      changeSummary?: string;
    }
  ): Promise<{ version: number }> {
    const existing = await this.db.queryFirst<DbJournalArticleRow>(
      "SELECT * FROM journal_articles WHERE id = ?",
      [id]
    );
    if (!existing) {
      throw new Error(`Article ${id} not found.`);
    }

    const nextVersion = existing.version + 1;
    const now = new Date().toISOString();

    const newTitle = input.title ?? existing.title;
    const newExcerpt = input.excerpt ?? existing.excerpt;
    const newContent = input.contentSource ?? existing.content_source;

    await this.db.execute(
      `UPDATE journal_articles SET
        title = ?,
        subtitle = COALESCE(?, subtitle),
        excerpt = ?,
        content_source = ?,
        category_id = COALESCE(?, category_id),
        featured_media_id = COALESCE(?, featured_media_id),
        reading_time_minutes = COALESCE(?, reading_time_minutes),
        version = ?,
        updated_by = ?,
        updated_at = ?
      WHERE id = ?`,
      [
        newTitle,
        input.subtitle ?? null,
        newExcerpt,
        newContent,
        input.categoryId ?? null,
        input.featuredMediaId ?? null,
        input.readingTimeMinutes ?? null,
        nextVersion,
        input.editorId ?? null,
        now,
        id,
      ]
    );

    // Record revision
    const revId = `jrev_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    await this.db.execute(
      `INSERT INTO journal_article_revisions (
        id, article_id, revision_number, title_snapshot, excerpt_snapshot,
        content_snapshot, editor_id, change_summary, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        revId,
        id,
        nextVersion,
        newTitle,
        newExcerpt,
        newContent,
        input.editorId ?? null,
        input.changeSummary || "Article edited",
        now,
      ]
    );

    return { version: nextVersion };
  }

  /**
   * Publishes an article (marks status = 'PUBLISHED' and sets published_at).
   */
  async publishArticle(id: string, publishedAt?: string): Promise<boolean> {
    const formatted = publishedAt
      ? new Date(publishedAt).toISOString().replace("T", " ").replace(/\..+/, "")
      : null;
    const res = await this.db.execute(
      `UPDATE journal_articles SET status = 'PUBLISHED', published_at = COALESCE(?, datetime('now')), updated_at = datetime('now') WHERE id = ?`,
      [formatted, id]
    );
    return (res.rowsAffected ?? 0) > 0;
  }

  /**
   * Unpublishes an article (reverts to 'DRAFT').
   */
  async unpublishArticle(id: string): Promise<boolean> {
    const now = new Date().toISOString();
    const res = await this.db.execute(
      `UPDATE journal_articles SET status = 'DRAFT', updated_at = ? WHERE id = ?`,
      [now, id]
    );
    return (res.rowsAffected ?? 0) > 0;
  }

  /**
   * Archives an article (marks status = 'ARCHIVED').
   */
  async archiveArticle(id: string): Promise<boolean> {
    const now = new Date().toISOString();
    const res = await this.db.execute(
      `UPDATE journal_articles SET status = 'ARCHIVED', updated_at = ? WHERE id = ?`,
      [now, id]
    );
    return (res.rowsAffected ?? 0) > 0;
  }

  /**
   * Safely updates an article's slug and preserves previous slug in slug history for 301 redirects.
   */
  async changeArticleSlug(id: string, newSlug: string): Promise<boolean> {
    const cleanNewSlug = newSlug.trim().toLowerCase();
    const existing = await this.db.queryFirst<{ slug: string }>(
      "SELECT slug FROM journal_articles WHERE id = ?",
      [id]
    );
    if (!existing) return false;
    if (existing.slug === cleanNewSlug) return true;

    const now = new Date().toISOString();
    // Record old slug
    const historyId = `slg_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    await this.db.execute(
      "INSERT INTO journal_article_slug_history (id, article_id, old_slug, created_at) VALUES (?, ?, ?, ?)",
      [historyId, id, existing.slug, now]
    );

    // Update article slug
    await this.db.execute(
      "UPDATE journal_articles SET slug = ?, updated_at = ? WHERE id = ?",
      [cleanNewSlug, now, id]
    );

    return true;
  }

  /**
   * Sets an editorial placement slot on the Journal Homepage.
   */
  async setPlacement(
    slot: "HERO" | "LEAD" | "SECONDARY" | "PRIVACY_SPOTLIGHT" | "GUIDE_FEATURE" | "DARK_CHAPTER" | "LATEST_INDEX",
    articleId: string,
    priority = 10
  ): Promise<boolean> {
    const now = new Date().toISOString();
    const existing = await this.db.queryFirst<{ id: string }>(
      "SELECT id FROM journal_placements WHERE slot = ?",
      [slot]
    );

    if (existing) {
      await this.db.execute(
        "UPDATE journal_placements SET article_id = ?, priority = ?, updated_at = ? WHERE id = ?",
        [articleId, priority, now, existing.id]
      );
    } else {
      const id = `jplc_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
      await this.db.execute(
        "INSERT INTO journal_placements (id, slot, article_id, priority, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        [id, slot, articleId, priority, now, now]
      );
    }
    return true;
  }

  /**
   * Queries which articles use a particular media asset and in what role.
   * Prevents accidental overwriting or deletion of shared media in Cloudflare R2 / D1.
   */
  async getMediaUsage(mediaId: string): Promise<MediaUsageResult[]> {
    const query = `
      SELECT 
        a.id as article_id,
        a.title as article_title,
        a.slug as article_slug,
        jam.role as role
      FROM journal_article_media jam
      JOIN journal_articles a ON jam.article_id = a.id
      WHERE jam.media_id = ?
      UNION
      SELECT 
        a.id as article_id,
        a.title as article_title,
        a.slug as article_slug,
        'HERO' as role
      FROM journal_articles a
      WHERE a.featured_media_id = ?
    `;
    const rows = await this.db.query<{
      article_id: string;
      article_title: string;
      article_slug: string;
      role: string;
    }>(query, [mediaId, mediaId]);

    return rows.map((r) => ({
      articleId: r.article_id,
      articleTitle: r.article_title,
      articleSlug: r.article_slug,
      role: r.role,
    }));
  }

  // --------------------------------------------------------------------------
  // PRIVATE HELPERS
  // --------------------------------------------------------------------------

  private mapArticleRow(row: DbJournalArticleRow): PublicArticleResult {
    return {
      id: row.id,
      publicId: row.public_id,
      slug: row.slug,
      title: row.title,
      subtitle: row.subtitle || undefined,
      excerpt: row.excerpt || undefined,
      contentFormat: row.content_format,
      contentSource: row.content_source,
      status: row.status,
      category: {
        name: row.category_name || "Vehicle Safety",
        slug: row.category_slug || "vehicle-safety",
      },
      author: {
        name: row.author_name || "VaahanSafe Editorial Team",
        role: row.author_role || "Safety & Privacy Engineering",
      },
      media: row.media_storage_key
        ? {
            storageKey: row.media_storage_key,
            url: this.resolveAssetUrl(row.media_storage_key),
            altText: row.media_alt_text || undefined,
            caption: row.media_caption || undefined,
            frameType: row.media_frame_type || undefined,
            focalPoint: {
              x: row.media_focal_x ?? 50,
              y: row.media_focal_y ?? 50,
            },
          }
        : undefined,
      thumbnail: row.thumbnail_storage_key
        ? {
            storageKey: row.thumbnail_storage_key,
            url: this.resolveAssetUrl(row.thumbnail_storage_key),
            altText: row.thumbnail_alt_text || undefined,
            caption: row.thumbnail_caption || undefined,
            frameType: row.thumbnail_frame_type || undefined,
            focalPoint: {
              x: row.thumbnail_focal_x ?? 50,
              y: row.thumbnail_focal_y ?? 50,
            },
          }
        : undefined,
      readingTimeMinutes: row.reading_time_minutes || 5,
      publishedAt: row.published_at || row.created_at,
      version: row.version || 1,
    };
  }

  private resolveAssetUrl(storageKey: string): string {
    if (!storageKey) return "";
    if (
      storageKey.startsWith("http://") ||
      storageKey.startsWith("https://") ||
      storageKey.startsWith("/")
    ) {
      return storageKey;
    }
    const baseUrl =
      (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_ASSETS_URL) ||
      "https://assets.vaahansafe.com";
    const cleanBase = baseUrl.replace(/\/$/, "");
    const cleanKey = storageKey.replace(/^\//, "");
    return `${cleanBase}/${cleanKey}`;
  }
}
