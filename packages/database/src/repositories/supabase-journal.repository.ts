import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { BlogPost, BlogCategory } from "@vaahansafe/content";


export function formatSupabaseError(error: unknown): string {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  const err = error as Record<string, any>;
  const parts = [
    err.message,
    err.details,
    err.hint,
    err.code ? `[Code: ${err.code}]` : null,
  ].filter(Boolean);
  return parts.length > 0
    ? parts.join(" — ")
    : JSON.stringify(error, Object.getOwnPropertyNames(error));
}

function getSupabaseClient(): SupabaseClient {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) throw new Error("Supabase journal configuration is missing");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function mapJournalArticle(row: Record<string, any>): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    deck: row.deck || undefined,
    intro: row.intro,
    category: row.category as BlogCategory,
    categorySlug: row.category_slug,
    status: row.status,
    date: row.date_display,
    publishedAt: row.published_at,
    updatedAt: row.updated_at || undefined,
    readingTime: row.reading_time,
    readingTimeMinutes: row.reading_time_minutes,
    wordCount: row.word_count,
    isFeatured: !!row.is_featured,
    isGuide: !!row.is_guide,
    featuredImageUrl: row.featured_image_url || undefined,
    heroMedia: row.hero_media || undefined,
    previewMedia: row.preview_media || undefined,
    editorialMedia: row.editorial_media || undefined,
    author: {
      name: row.author_name,
      role: row.author_role,
    },
    tags: row.tags || [],
    keyTakeaways: row.key_takeaways || [],
    body: row.body || [],
    checklist: row.checklist || undefined,
    faq: row.faq || undefined,
    references: row.references_data || [],
    relatedSlugs: row.related_slugs || [],
    officialDocumentRef: row.official_document_ref || undefined,
    hasDarkSection: !!row.has_dark_section,
    darkSectionContent: row.dark_section_content || undefined,
    contentMarkdown: row.content_markdown || undefined,
    seoTitle: row.seo_title || undefined,
    seoDescription: row.seo_description || undefined,
  };
}

export class SupabaseJournalRepository {
  private client: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.client = client || getSupabaseClient();
  }

  // --------------------------------------------------------------------------
  // Public Reading Methods (Blog Website)
  // --------------------------------------------------------------------------

  async getPublishedArticles(): Promise<BlogPost[]> {
    const { data, error } = await this.client
      .from("journal_articles")
      .select("*")
      .eq("status", "PUBLISHED")
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false });

    if (error) {
      const formatted = formatSupabaseError(error);
      console.warn("[SupabaseJournalRepository] Error fetching published articles:", formatted);
      throw new Error(formatted);
    }

    return (data || []).map(mapJournalArticle);
  }

  async getArticleBySlug(slug: string): Promise<BlogPost | null> {
    const { data, error } = await this.client
      .from("journal_articles")
      .select("*")
      .eq("slug", slug.trim().toLowerCase())
      .maybeSingle();

    if (error) {
      const formatted = formatSupabaseError(error);
      console.warn(`[SupabaseJournalRepository] Error fetching article by slug ${slug}:`, formatted);
      throw new Error(formatted);
    }

    return data ? mapJournalArticle(data) : null;
  }

  async getPublishedArticlesByCategory(categorySlug: string): Promise<BlogPost[]> {
    const { data, error } = await this.client
      .from("journal_articles")
      .select("*")
      .eq("category_slug", categorySlug.trim().toLowerCase())
      .eq("status", "PUBLISHED")
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false });

    if (error) {
      const formatted = formatSupabaseError(error);
      console.warn(`[SupabaseJournalRepository] Error fetching articles by category ${categorySlug}:`, formatted);
      throw new Error(formatted);
    }

    return (data || []).map(mapJournalArticle);
  }

  async searchPublishedArticles(searchTerm: string): Promise<BlogPost[]> {
    const clean = searchTerm.trim();
    if (!clean) return this.getPublishedArticles();

    const { data, error } = await this.client
      .from("journal_articles")
      .select("*")
      .eq("status", "PUBLISHED")
      .lte("published_at", new Date().toISOString())
      .or(`title.ilike.%${clean}%,excerpt.ilike.%${clean}%,intro.ilike.%${clean}%`)
      .order("published_at", { ascending: false });

    if (error) {
      const formatted = formatSupabaseError(error);
      console.warn(`[SupabaseJournalRepository] Error searching articles with term ${searchTerm}:`, formatted);
      throw new Error(formatted);
    }

    return (data || []).map(mapJournalArticle);
  }

  async getCategoriesWithCounts(): Promise<
    Array<{
      id: string;
      slug: string;
      name: string;
      indexNumber: string;
      description: string | null;
      headline: string | null;
      spotlightDeck: string | null;
      iconName: string | null;
      orderNum: number;
      count: number;
    }>
  > {
    const { data: categories, error: catError } = await this.client
      .from("journal_categories")
      .select("*")
      .eq("is_active", true)
      .order("order_num", { ascending: true });

    if (catError) throw catError;

    const { data: articles, error: artError } = await this.client
      .from("journal_articles")
      .select("category_slug")
      .eq("status", "PUBLISHED")
      .lte("published_at", new Date().toISOString());

    if (artError) throw artError;

    const counts: Record<string, number> = {};
    for (const a of articles || []) {
      counts[a.category_slug] = (counts[a.category_slug] || 0) + 1;
    }

    return (categories || []).map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      indexNumber: c.index_number,
      description: c.description,
      headline: c.headline,
      spotlightDeck: c.spotlight_deck,
      iconName: c.icon_name,
      orderNum: c.order_num,
      count: counts[c.slug] || 0,
    }));
  }

  // --------------------------------------------------------------------------
  // Admin Operations (Manageable by Admin)
  // --------------------------------------------------------------------------

  async getAllArticlesForAdmin(): Promise<BlogPost[]> {
    const { data, error } = await this.client
      .from("journal_articles")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[SupabaseJournalRepository] Error fetching all articles for admin:", error);
      throw error;
    }

    return (data || []).map(mapJournalArticle);
  }

  async getArticleById(id: string): Promise<BlogPost | null> {
    const { data, error } = await this.client
      .from("journal_articles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error(`[SupabaseJournalRepository] Error fetching article by id ${id}:`, error);
      throw error;
    }

    return data ? mapJournalArticle(data) : null;
  }

  async createArticle(input: Partial<BlogPost> & { title: string; excerpt: string; intro: string }): Promise<BlogPost> {
    const id = input.id || `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const slug = input.slug || input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const now = new Date().toISOString();

    const row = {
      id,
      slug,
      title: input.title,
      excerpt: input.excerpt,
      deck: input.deck || null,
      intro: input.intro,
      category: input.category || "Vehicle Safety",
      category_slug: input.categorySlug || "vehicle-safety",
      status: input.status || "DRAFT",
      date_display: input.date || new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date()),
      published_at: input.publishedAt || (input.status === "PUBLISHED" ? now : null),
      reading_time: input.readingTime || `${Math.max(1, Math.ceil((input.intro.length + input.excerpt.length) / 500))} min read`,
      reading_time_minutes: input.readingTimeMinutes || 5,
      word_count: input.wordCount || 1000,
      is_featured: !!input.isFeatured,
      is_guide: !!input.isGuide,
      featured_image_url: input.featuredImageUrl || null,
      hero_media: input.heroMedia || null,
      preview_media: input.previewMedia || null,
      editorial_media: input.editorialMedia || null,
      author_name: input.author?.name || "VaahanSafe Editorial Team",
      author_role: input.author?.role || "Editorial Desk",
      tags: input.tags || [],
      key_takeaways: input.keyTakeaways || [],
      body: input.body || [],
      checklist: input.checklist || null,
      faq: input.faq || null,
      references_data: input.references || [],
      related_slugs: input.relatedSlugs || [],
      official_document_ref: input.officialDocumentRef || null,
      has_dark_section: !!input.hasDarkSection,
      dark_section_content: input.darkSectionContent || null,
      content_markdown: input.contentMarkdown || null,
      seo_title: input.seoTitle || input.title,
      seo_description: input.seoDescription || input.excerpt,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await this.client
      .from("journal_articles")
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("[SupabaseJournalRepository] Error creating article:", error);
      throw error;
    }

    return mapJournalArticle(data);
  }

  async updateArticle(id: string, updates: Partial<BlogPost>): Promise<BlogPost> {
    const now = new Date().toISOString();
    const payload: Record<string, any> = {
      updated_at: now,
    };

    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.slug !== undefined) payload.slug = updates.slug;
    if (updates.excerpt !== undefined) payload.excerpt = updates.excerpt;
    if (updates.deck !== undefined) payload.deck = updates.deck || null;
    if (updates.intro !== undefined) payload.intro = updates.intro;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.categorySlug !== undefined) payload.category_slug = updates.categorySlug;
    if (updates.status !== undefined) {
      payload.status = updates.status;
      if (updates.status === "PUBLISHED" && !updates.publishedAt) {
        payload.published_at = now;
      }
    }
    if (updates.publishedAt !== undefined) payload.published_at = updates.publishedAt;
    if (updates.date !== undefined) payload.date_display = updates.date;
    if (updates.readingTime !== undefined) payload.reading_time = updates.readingTime;
    if (updates.readingTimeMinutes !== undefined) payload.reading_time_minutes = updates.readingTimeMinutes;
    if (updates.wordCount !== undefined) payload.word_count = updates.wordCount;
    if (updates.isFeatured !== undefined) payload.is_featured = updates.isFeatured;
    if (updates.isGuide !== undefined) payload.is_guide = updates.isGuide;
    if (updates.featuredImageUrl !== undefined) payload.featured_image_url = updates.featuredImageUrl;
    if (updates.heroMedia !== undefined) payload.hero_media = updates.heroMedia;
    if (updates.author !== undefined) {
      payload.author_name = updates.author.name;
      payload.author_role = updates.author.role;
    }
    if (updates.tags !== undefined) payload.tags = updates.tags;
    if (updates.keyTakeaways !== undefined) payload.key_takeaways = updates.keyTakeaways;
    if (updates.body !== undefined) payload.body = updates.body;
    if (updates.checklist !== undefined) payload.checklist = updates.checklist;
    if (updates.faq !== undefined) payload.faq = updates.faq;
    if (updates.references !== undefined) payload.references_data = updates.references;
    if (updates.relatedSlugs !== undefined) payload.related_slugs = updates.relatedSlugs;
    if (updates.officialDocumentRef !== undefined) payload.official_document_ref = updates.officialDocumentRef;
    if (updates.contentMarkdown !== undefined) payload.content_markdown = updates.contentMarkdown;
    if (updates.seoTitle !== undefined) payload.seo_title = updates.seoTitle;
    if (updates.seoDescription !== undefined) payload.seo_description = updates.seoDescription;

    const { data, error } = await this.client
      .from("journal_articles")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`[SupabaseJournalRepository] Error updating article ${id}:`, error);
      throw error;
    }

    return mapJournalArticle(data);
  }

  async deleteArticle(id: string): Promise<boolean> {
    const { error } = await this.client
      .from("journal_articles")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`[SupabaseJournalRepository] Error deleting article ${id}:`, error);
      throw error;
    }

    return true;
  }

  async publishArticle(id: string): Promise<boolean> {
    const now = new Date().toISOString();
    const { error } = await this.client
      .from("journal_articles")
      .update({ status: "PUBLISHED", published_at: now, updated_at: now })
      .eq("id", id);

    if (error) throw error;
    return true;
  }

  async unpublishArticle(id: string): Promise<boolean> {
    const now = new Date().toISOString();
    const { error } = await this.client
      .from("journal_articles")
      .update({ status: "DRAFT", updated_at: now })
      .eq("id", id);

    if (error) throw error;
    return true;
  }
}

let defaultSupabaseJournalRepo: SupabaseJournalRepository | null = null;

export function getSupabaseJournalRepository(): SupabaseJournalRepository {
  if (!defaultSupabaseJournalRepo) {
    defaultSupabaseJournalRepo = new SupabaseJournalRepository();
  }
  return defaultSupabaseJournalRepo;
}

