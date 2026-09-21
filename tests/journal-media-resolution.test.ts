import { describe, it, expect } from "vitest";
import {
  getPublishedArticles,
  getArticleBySlug,
  getJournalLandingData,
  resolveArticleMedia,
  resolveArticlePreviewMedia,
  resolveArticleOgMedia,
  BlogPost,
} from "@vaahansafe/content";
import {
  D1JournalRepository,
  PublicArticleResult,
} from "@vaahansafe/database";

describe("VaahanSafe Journal — Media Resolution & Anti-Duplication Architecture", () => {
  const allArticles = getPublishedArticles();

  it("Invariant 1: All published seeded articles have distinct, non-duplicate hero images", () => {
    const articlesWithImages = allArticles.filter((a) => Boolean(a.featuredImageUrl));
    const imageUrls = articlesWithImages.map((a) => a.featuredImageUrl as string);
    const uniqueUrls = new Set(imageUrls);

    // Each article with an image MUST have its own unique assigned asset
    expect(uniqueUrls.size).toBe(imageUrls.length);
  });

  it("Invariant 2: resolveArticleMedia returns distinct media for distinct articles", () => {
    const roadsideStory = getArticleBySlug("roadside-bystander-action-chain");
    const opticalStory = getArticleBySlug("optical-contrast-automotive-glazing");
    const privacyStory = getArticleBySlug("separating-contacts-from-address");

    expect(roadsideStory).toBeDefined();
    expect(opticalStory).toBeDefined();
    expect(privacyStory).toBeDefined();

    const roadsideHero = resolveArticleMedia(roadsideStory!, "HERO");
    const opticalHero = resolveArticleMedia(opticalStory!, "HERO");
    const privacyHero = resolveArticleMedia(privacyStory!, "HERO");

    // Must be distinct
    expect(roadsideHero.src).not.toBe(opticalHero.src);
    expect(opticalHero.src).not.toBe(privacyHero.src);
    expect(roadsideHero.src).not.toBe(privacyHero.src);

    // Must not be fallbacks
    expect(roadsideHero.isFallback).toBe(false);
    expect(opticalHero.isFallback).toBe(false);
    expect(privacyHero.isFallback).toBe(false);
  });

  it("Invariant 3: Missing media returns clean fallback and NEVER borrows another article's image", () => {
    const articleWithoutMedia: BlogPost = {
      id: "art_test_no_media",
      slug: "test-story-no-media",
      title: "Story Without Assigned Media",
      deck: "This story has no R2 image assigned yet.",
      intro: "Testing missing media fallback behavior.",
      category: "Vehicle Privacy",
      categorySlug: "privacy",
      date: "21 SEP 2026",
      publishedAt: "2026-09-21T00:00:00Z",
      readingTime: "03 MIN",
      wordCount: 450,
      author: {
        name: "Test Author",
        role: "Editorial Contributor",
      },
      tags: ["Privacy", "Security"],
      body: [],
      // Explicitly no featuredImageUrl or media
      featuredImageUrl: undefined,
      media: undefined,
    };

    const resolved = resolveArticleMedia(articleWithoutMedia, "HERO");

    expect(resolved.isFallback).toBe(true);
    expect(resolved.src).toBeUndefined();

    // Verify it NEVER borrowed an existing article's image
    const existingImageUrls = allArticles
      .map((a) => a.featuredImageUrl)
      .filter((url): url is string => Boolean(url));

    expect(existingImageUrls).not.toContain(resolved.src);
  });

  it("Invariant 4: Deterministic Preview Media priority (THUMBNAIL -> HERO -> Fallback)", () => {
    // Article with both thumbnail and hero
    const articleWithBoth: BlogPost = {
      id: "art_both",
      slug: "art-both",
      title: "Story with Both",
      deck: "Deck",
      intro: "Intro",
      category: "Vehicle Safety",
      categorySlug: "vehicle-safety",
      date: "21 SEP 2026",
      publishedAt: "2026-09-21T00:00:00Z",
      readingTime: "04 MIN",
      author: { name: "Author", role: "Role" },
      tags: [],
      body: [],
      media: {
        hero: {
          storageKey: "hero-asset.jpg",
          url: "https://assets.vaahansafe.com/hero-asset.jpg",
          alt: "Hero Alt",
          role: "HERO",
        },
        thumbnail: {
          storageKey: "thumb-asset.jpg",
          url: "https://assets.vaahansafe.com/thumb-asset.jpg",
          alt: "Thumb Alt",
          role: "THUMBNAIL",
        },
      },
    };

    const preview = resolveArticlePreviewMedia(articleWithBoth);
    expect(preview.src).toBe("https://assets.vaahansafe.com/thumb-asset.jpg");
    expect(preview.role).toBe("THUMBNAIL");

    // Article with only hero
    const articleWithHeroOnly: BlogPost = {
      ...articleWithBoth,
      id: "art_hero_only",
      media: {
        hero: {
          storageKey: "hero-asset.jpg",
          url: "https://assets.vaahansafe.com/hero-asset.jpg",
          alt: "Hero Alt",
          role: "HERO",
        },
      },
    };

    const previewHeroOnly = resolveArticlePreviewMedia(articleWithHeroOnly);
    expect(previewHeroOnly.src).toBe("https://assets.vaahansafe.com/hero-asset.jpg");
    expect(previewHeroOnly.role).toBe("HERO");
  });

  it("Invariant 5: Deterministic Social OG priority (OG -> HERO -> Global Fallback)", () => {
    const articleWithOg: BlogPost = {
      id: "art_og",
      slug: "art-og",
      title: "Story with OG",
      deck: "Deck",
      intro: "Intro",
      category: "Vehicle Safety",
      categorySlug: "vehicle-safety",
      date: "21 SEP 2026",
      publishedAt: "2026-09-21T00:00:00Z",
      readingTime: "04 MIN",
      author: { name: "Author", role: "Role" },
      tags: [],
      body: [],
      media: {
        og: {
          storageKey: "og-asset.jpg",
          url: "https://assets.vaahansafe.com/og-asset.jpg",
          alt: "OG Alt",
          role: "OG",
        },
        hero: {
          storageKey: "hero-asset.jpg",
          url: "https://assets.vaahansafe.com/hero-asset.jpg",
          alt: "Hero Alt",
          role: "HERO",
        },
      },
    };

    const ogResolved = resolveArticleOgMedia(articleWithOg);
    expect(ogResolved.src).toBe("https://assets.vaahansafe.com/og-asset.jpg");

    // When OG is absent, falls back to hero
    const articleNoOg: BlogPost = {
      ...articleWithOg,
      media: {
        hero: {
          storageKey: "hero-asset.jpg",
          url: "https://assets.vaahansafe.com/hero-asset.jpg",
          alt: "Hero Alt",
          role: "HERO",
        },
      },
    };

    const ogFromHero = resolveArticleOgMedia(articleNoOg);
    expect(ogFromHero.src).toBe("https://assets.vaahansafe.com/hero-asset.jpg");

    // When both absent, falls back to global journal OG fallback
    const articleEmpty: BlogPost = {
      ...articleWithOg,
      media: undefined,
      featuredImageUrl: undefined,
    };

    const globalOg = resolveArticleOgMedia(articleEmpty);
    expect(globalOg.src).toBe("https://assets.vaahansafe.com/journal/og-journal-fallback.jpg");
  });

  it("Invariant 6: Homepage landing composition preserves distinct article-media relationships", () => {
    const landing = getJournalLandingData();

    const featuredMedia = resolveArticleMedia(landing.featuredStory, "HERO");
    const leadMedia = resolveArticleMedia(landing.leadStory, "HERO");
    const verticalMedia = resolveArticlePreviewMedia(landing.verticalStory);

    // Each homepage story slot must resolve its OWN assigned media
    expect(featuredMedia.src).toBeDefined();
    expect(leadMedia.src).toBeDefined();
    expect(verticalMedia.src).toBeDefined();

    expect(featuredMedia.src).not.toBe(leadMedia.src);
    expect(leadMedia.src).not.toBe(verticalMedia.src);
    expect(featuredMedia.src).not.toBe(verticalMedia.src);
  });

  it("Invariant 7: Zero randomness — resolutions are 100% deterministic", () => {
    const story = getArticleBySlug("roadside-bystander-action-chain")!;

    const first = resolveArticleMedia(story, "HERO");
    for (let i = 0; i < 20; i++) {
      const repeated = resolveArticleMedia(story, "HERO");
      expect(repeated.src).toBe(first.src);
      expect(repeated.alt).toBe(first.alt);
      expect(repeated.role).toBe(first.role);
    }
  });

  it("Invariant 8: Database Repository maps thumbnail and focal point correctly", async () => {
    // Mock DatabaseClient for unit verification of D1JournalRepository mapping
    const mockDb = {
      query: async () => [],
      queryFirst: async <T>() => {
        return {
          id: "jart_test_1",
          public_id: "art_test_1",
          slug: "test-slug",
          title: "Test Article",
          subtitle: "Subtitle",
          excerpt: "Excerpt",
          content_format: "MARKDOWN",
          content_source: "# Test",
          status: "PUBLISHED" as const,
          category_id: "jcat_1",
          author_id: "jauth_1",
          featured_media_id: "jmed_hero_1",
          og_media_id: null,
          seo_title: null,
          seo_description: null,
          reading_time_minutes: 5,
          scheduled_at: null,
          published_at: "2026-09-21 00:00:00",
          version: 1,
          created_by: null,
          updated_by: null,
          created_at: "2026-09-21 00:00:00",
          updated_at: "2026-09-21 00:00:00",
          category_name: "Vehicle Safety",
          category_slug: "vehicle-safety",
          author_name: "Staff",
          author_role: "Editor",
          media_storage_key: "journal/hero-test.jpg",
          media_alt_text: "Hero Alt Test",
          media_caption: "Hero Caption Test",
          media_frame_type: "OFFSET_LANDSCAPE",
          media_focal_x: 45,
          media_focal_y: 55,
          thumbnail_storage_key: "journal/thumb-test.jpg",
          thumbnail_alt_text: "Thumb Alt Test",
          thumbnail_caption: "Thumb Caption Test",
          thumbnail_frame_type: "CROPPED_DETAIL",
          thumbnail_focal_x: 50,
          thumbnail_focal_y: 50,
        } as unknown as T;
      },
      execute: async () => ({ success: true, meta: { changes: 1 } }),
      batch: async () => [],
    };

    const repo = new D1JournalRepository(mockDb);
    const result = await repo.getPublishedArticleBySlug("test-slug");

    expect(result).not.toBeNull();
    expect(result!.media).toBeDefined();
    expect(result!.media!.storageKey).toBe("journal/hero-test.jpg");
    expect(result!.media!.focalPoint).toEqual({ x: 45, y: 55 });

    expect(result!.thumbnail).toBeDefined();
    expect(result!.thumbnail!.storageKey).toBe("journal/thumb-test.jpg");
    expect(result!.thumbnail!.focalPoint).toEqual({ x: 50, y: 50 });
  });

  it("Invariant 9: getMediaUsage queries both explicit junction and legacy relationships", async () => {
    const mockDb = {
      query: async <T>() => {
        return [
          {
            article_id: "jart_01",
            article_title: "Highway Bystander Action Chain",
            article_slug: "highway-bystander-action-chain",
            role: "HERO",
          },
          {
            article_id: "jart_02",
            article_title: "Separating Contacts from Address",
            article_slug: "separating-contacts-from-address",
            role: "THUMBNAIL",
          },
        ] as unknown as T[];
      },
      queryFirst: async () => null,
      execute: async () => ({ success: true, meta: { changes: 1 } }),
      batch: async () => [],
    };

    const repo = new D1JournalRepository(mockDb);
    const usage = await repo.getMediaUsage("jmed_hero");

    expect(usage).toHaveLength(2);
    expect(usage[0].articleId).toBe("jart_01");
    expect(usage[0].role).toBe("HERO");
    expect(usage[1].articleId).toBe("jart_02");
    expect(usage[1].role).toBe("THUMBNAIL");
  });
});
