import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import * as fs from "node:fs";
import * as path from "node:path";
import { D1JournalRepository } from "../packages/database/src/repositories/journal.repository";
import type { DatabaseClient } from "../packages/database/src/client/d1";
import { normalizeSlug, isValidSlug } from "../packages/content/src/services/slug.service";
import { calculateReadingTime } from "../packages/content/src/services/reading-time.service";

/**
 * Adapter from DatabaseSync to DatabaseClient interface
 */
class SqliteSyncClientAdapter implements DatabaseClient {
  constructor(private db: DatabaseSync) {}

  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    return stmt.all(...(params as any[])) as T[];
  }

  async queryFirst<T = unknown>(sql: string, params: unknown[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 && rows[0] !== undefined ? rows[0] : null;
  }

  async execute(sql: string, params: unknown[] = []): Promise<{ success: boolean; rowsAffected?: number }> {
    const stmt = this.db.prepare(sql);
    const info = stmt.run(...(params as any[]));
    return { success: true, rowsAffected: Number(info.changes) };
  }

  async batch(operations: Array<{ sql: string; params?: unknown[] }>): Promise<boolean> {
    for (const op of operations) {
      await this.execute(op.sql, op.params || []);
    }
    return true;
  }
}

describe("VaahanSafe Journal — Cloudflare D1 Publishing Subsystem (0010_journal_publishing.sql)", () => {
  let db: DatabaseSync;
  let client: DatabaseClient;
  let repo: D1JournalRepository;

  beforeEach(() => {
    db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");

    const migrationsDir = path.resolve(__dirname, "../infrastructure/cloudflare/d1/migrations");
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    // Execute all migrations up to 0010
    for (const f of migrationFiles) {
      const sql = fs.readFileSync(path.join(migrationsDir, f), "utf8");
      db.exec(sql);
    }

    client = new SqliteSyncClientAdapter(db);
    repo = new D1JournalRepository(client);
  });

  it("seeds canonical categories, author, articles, and placements from day one", async () => {
    const categories = await repo.getCategoriesWithCounts();
    expect(categories.length).toBeGreaterThanOrEqual(6);

    const safetyCat = categories.find((c) => c.slug === "vehicle-safety");
    expect(safetyCat).toBeDefined();
    expect(safetyCat?.name).toBe("Vehicle Safety");

    const articles = await repo.getPublishedArticles(10);
    expect(articles.length).toBeGreaterThanOrEqual(5);

    const hero = await repo.getPublishedArticleBySlug("vehicle-qr-privacy-boundary");
    expect(hero).toBeDefined();
    expect(hero?.title).toBe("What Information Should Your Vehicle Make Available When It Matters?");
    expect(hero?.category.slug).toBe("vehicle-safety");
    expect(hero?.author.name).toBe("VaahanSafe Editorial Team");
    expect(hero?.media?.storageKey).toBe("blog/editorial/vehicle-qr-safety-hero.webp");
  });

  it("strictly excludes DRAFT and future SCHEDULED articles from public reads", async () => {
    // 1. Create a DRAFT article
    await repo.createArticle({
      title: "Unpublished Security Research",
      slug: "unpublished-security-research",
      contentSource: "Confidential internal analysis",
    });

    // Public query by slug must return null
    const draftRead = await repo.getPublishedArticleBySlug("unpublished-security-research");
    expect(draftRead).toBeNull();

    // 2. Create a SCHEDULED article with future timestamp
    const futureDate = new Date(Date.now() + 86400000 * 7).toISOString(); // 7 days in future
    const { id: scheduledId } = await repo.createArticle({
      title: "Future 2027 Safety Release",
      slug: "future-2027-safety-release",
      contentSource: "Coming soon",
    });

    await db.prepare(
      "UPDATE journal_articles SET status = 'SCHEDULED', scheduled_at = ?, published_at = ? WHERE id = ?"
    ).run(futureDate, futureDate, scheduledId);

    // Public query must return null
    const scheduledRead = await repo.getPublishedArticleBySlug("future-2027-safety-release");
    expect(scheduledRead).toBeNull();

    // 3. Publishing the article enables public discovery
    await repo.publishArticle(scheduledId, new Date().toISOString());
    const publishedRead = await repo.getPublishedArticleBySlug("future-2027-safety-release");
    expect(publishedRead).not.toBeNull();
    expect(publishedRead?.title).toBe("Future 2027 Safety Release");
  });

  it("automatically creates revision history on article updates without overwriting history", async () => {
    // 1. Initial article has version 1
    const article = await repo.getPublishedArticleBySlug("vehicle-qr-privacy-boundary");
    expect(article).toBeDefined();
    expect(article?.version).toBe(1);

    // 2. Update the article content
    const updateResult = await repo.updateArticle(article!.id, {
      title: "Updated: What Information Should Your Vehicle Make Available?",
      contentSource: "Updated authoritative content source...",
      changeSummary: "Refined headline for clarity",
    });

    expect(updateResult.version).toBe(2);

    // 3. Verify revision snapshots in journal_article_revisions
    const revisions = db
      .prepare("SELECT * FROM journal_article_revisions WHERE article_id = ? ORDER BY revision_number ASC")
      .all(article!.id) as Array<{ revision_number: number; title_snapshot: string; change_summary: string }>;

    expect(revisions).toHaveLength(2);
    expect(revisions[0]!.revision_number).toBe(1);
    expect(revisions[1]!.revision_number).toBe(2);
    expect(revisions[1]!.title_snapshot).toContain("Updated:");
    expect(revisions[1]!.change_summary).toBe("Refined headline for clarity");
  });

  it("records slug history and allows 301 redirection when article URL slug changes", async () => {
    const article = await repo.getPublishedArticleBySlug("vehicle-qr-privacy-boundary");
    expect(article).toBeDefined();

    // Change slug
    const success = await repo.changeArticleSlug(article!.id, "vehicle-privacy-boundaries-2026");
    expect(success).toBe(true);

    // Old slug query now redirects to new slug
    const targetSlug = await repo.resolveSlugRedirect("vehicle-qr-privacy-boundary");
    expect(targetSlug).toBe("vehicle-privacy-boundaries-2026");

    // Querying with new slug resolves article
    const updatedArticle = await repo.getPublishedArticleBySlug("vehicle-privacy-boundaries-2026");
    expect(updatedArticle).toBeDefined();
    expect(updatedArticle?.id).toBe(article!.id);
  });

  it("resolves homepage placements deterministically without requiring code redeployments", async () => {
    const placements = await repo.getHomepagePlacements();
    expect(placements.HERO).toBeDefined();
    expect(placements.HERO?.slug).toBe("vehicle-qr-privacy-boundary");
    expect(placements.LEAD).toBeDefined();
    expect(placements.LEAD?.slug).toBe("emergency-contact-relays");
    expect(placements.SECONDARY).toBeDefined();
    expect(placements.SECONDARY?.slug).toBe("good-samaritan-law-india");
    expect(placements.DARK_CHAPTER).toBeDefined();

    // Update HERO placement to a different article
    const leadArticle = placements.LEAD!;
    await repo.setPlacement("HERO", leadArticle.id, 1);

    const updatedPlacements = await repo.getHomepagePlacements();
    expect(updatedPlacements.HERO?.id).toBe(leadArticle.id);
  });

  it("searches published articles across content without leaking draft articles", async () => {
    // 1. Search existing published articles for 'Samaritan'
    const results = await repo.searchPublishedArticles("Samaritan");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0]?.title).toContain("Good Samaritan");

    // 2. Draft matching query must not leak
    await repo.createArticle({
      title: "Secret Samaritan Guidelines",
      slug: "secret-samaritan-guidelines",
      contentSource: "Draft only Samaritan analysis",
    });

    const resultsAfterDraft = await repo.searchPublishedArticles("Secret");
    expect(resultsAfterDraft).toHaveLength(0);
  });

  it("normalizes and validates slugs correctly", () => {
    expect(normalizeSlug("What Information Should Your Vehicle Make Available?")).toBe(
      "what-information-should-your-vehicle-make-available"
    );
    expect(normalizeSlug("QR & Identity: 2026 Updates!!")).toBe("qr-identity-2026-updates");
    expect(isValidSlug("valid-article-slug")).toBe(true);
    expect(isValidSlug("INVALID SLUG")).toBe(false);
    expect(isValidSlug("ab")).toBe(false); // Too short
  });

  it("calculates deterministic reading times based on word count", () => {
    const shortText = "Word ".repeat(200); // 200 words = 1 minute
    const resultShort = calculateReadingTime(shortText);
    expect(resultShort.minutes).toBe(1);
    expect(resultShort.label).toBe("01 MIN READ");

    const longText = "Word ".repeat(1500); // 1500 words = 8 minutes
    const resultLong = calculateReadingTime(longText);
    expect(resultLong.minutes).toBe(8);
    expect(resultLong.label).toBe("08 MIN READ");
  });

  it("retrieves article tags and verifies N:M relations", async () => {
    const hero = await repo.getPublishedArticleBySlug("vehicle-qr-privacy-boundary");
    expect(hero).toBeDefined();

    const tags = await repo.getArticleTags(hero!.id);
    expect(tags).toContain("Vehicle Safety");
    expect(tags).toContain("Privacy");
  });

  it("resolves related articles deterministically without random selection", async () => {
    const related = await repo.getRelatedArticles("vehicle-qr-privacy-boundary", 2);
    expect(related.length).toBeLessThanOrEqual(2);
    expect(related.length).toBeGreaterThanOrEqual(1);

    // None should be the current article
    for (const art of related) {
      expect(art.slug).not.toBe("vehicle-qr-privacy-boundary");
      expect(art.status).toBe("PUBLISHED");
    }
  });

  it("supports unpublishing and archiving to remove articles from public access", async () => {
    const article = await repo.getPublishedArticleBySlug("vehicle-qr-privacy-boundary");
    expect(article).toBeDefined();

    // 1. Unpublish
    await repo.unpublishArticle(article!.id);
    const unpublishedRead = await repo.getPublishedArticleBySlug("vehicle-qr-privacy-boundary");
    expect(unpublishedRead).toBeNull();

    // 2. Re-publish
    await repo.publishArticle(article!.id);
    const republishedRead = await repo.getPublishedArticleBySlug("vehicle-qr-privacy-boundary");
    expect(republishedRead).not.toBeNull();

    // 3. Archive
    await repo.archiveArticle(article!.id);
    const archivedRead = await repo.getPublishedArticleBySlug("vehicle-qr-privacy-boundary");
    expect(archivedRead).toBeNull();
  });

  it("resolves R2 media storage keys to public CDN URLs without leaking provider endpoints", async () => {
    const hero = await repo.getPublishedArticleBySlug("vehicle-qr-privacy-boundary");
    expect(hero).toBeDefined();
    expect(hero?.media).toBeDefined();
    expect(hero?.media?.storageKey).toBe("blog/editorial/vehicle-qr-safety-hero.webp");
    expect(hero?.media?.url).toBe("https://assets.vaahansafe.com/blog/editorial/vehicle-qr-safety-hero.webp");
  });
});

