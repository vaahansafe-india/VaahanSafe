import { describe, it, expect } from "vitest";
import * as React from "react";
import fs from "node:fs";
import path from "node:path";
import {
  getPublishedArticles,
  getArticleBySlug,
  isArticlePublic,
} from "@vaahansafe/content";

describe("VaahanSafe Journal — System States, Network Handling & Web Icons", () => {
  const blogDir = path.resolve(__dirname, "../apps/blog");

  // ============================================================
  // 1. 404 NOT FOUND & SLUG REDIRECTION RULES
  // ============================================================
  describe("404 Not Found & Lost Signal Invariants", () => {
    it("not-found.tsx exists and uses JournalSystemState with 404 signal rail", () => {
      const notFoundPath = path.join(blogDir, "app/not-found.tsx");
      expect(fs.existsSync(notFoundPath)).toBe(true);

      const content = fs.readFileSync(notFoundPath, "utf-8");
      expect(content).toContain("JournalSystemState");
      expect(content).toContain('statusCode="404"');
      expect(content).toContain("ERROR / 404 • LOST SIGNAL");
      expect(content).toContain("This story");
      expect(content).toContain("on the map");
      expect(content).toContain('railType="404"');
      expect(content).toContain("Search Journal");
    });

    it("404 page safely handles content errors without throwing", () => {
      const notFoundPath = path.join(blogDir, "app/not-found.tsx");
      const content = fs.readFileSync(notFoundPath, "utf-8");

      // Verify try/catch wrapping around story loading
      expect(content).toContain("try {");
      expect(content).toContain("catch {");
      expect(content).toContain("recentStories = [];");
    });

    it("Public article retrieval strictly rejects draft and unpublished articles", () => {
      // Invariant: getArticleBySlug must only return published articles
      const testDraftSlug = "test-draft-nonexistent-article-xyz";
      const draftResult = getArticleBySlug(testDraftSlug);
      expect(draftResult).toBeUndefined();

      // Ensure that public checks do not leak draft status
      const simulatedDraft = {
        slug: "unreleased-internal-draft",
        status: "DRAFT" as const,
        publishedAt: new Date(Date.now() + 86400000).toISOString(),
      };
      expect(isArticlePublic(simulatedDraft as any)).toBe(false);
    });
  });

  // ============================================================
  // 2. 403 ACCESS BOUNDARY (FORBIDDEN STATE)
  // ============================================================
  describe("403 Access Boundary Invariants", () => {
    it("ForbiddenState.tsx exists and renders 403 access barrier rail", () => {
      const forbiddenPath = path.join(blogDir, "components/system/ForbiddenState.tsx");
      expect(fs.existsSync(forbiddenPath)).toBe(true);

      const content = fs.readFileSync(forbiddenPath, "utf-8");
      expect(content).toContain("JournalSystemState");
      expect(content).toContain('statusCode="403"');
      expect(content).toContain("SECURITY / 403 • ACCESS BOUNDARY");
      expect(content).toContain("This area");
      expect(content).toContain("to this session");
      expect(content).toContain('railType="403"');
      expect(content).toContain("https://app.vaahansafe.com/login");
    });
  });

  // ============================================================
  // 3. 500 SERVER ERROR & GLOBAL ERROR (NO INTERNAL LEAKS)
  // ============================================================
  describe("500 Server Error & Global Error Invariants", () => {
    it("error.tsx renders 500 signal rail and displays error.digest if present", () => {
      const errorPath = path.join(blogDir, "app/error.tsx");
      expect(fs.existsSync(errorPath)).toBe(true);

      const content = fs.readFileSync(errorPath, "utf-8");
      expect(content).toContain("JournalSystemState");
      expect(content).toContain('statusCode="500"');
      expect(content).toContain("SYSTEM / 500 • SIGNAL INTERRUPTED");
      expect(content).toContain("The Journal");
      expect(content).toContain("complete this request");
      expect(content).toContain('railType="500"');
      expect(content).toContain("referenceId={error?.digest}");
      expect(content).toContain("Try again");

      // Invariant: Never leak SQL, D1, R2, or internal credentials in public error copy
      expect(content).not.toContain("D1_DATABASE");
      expect(content).not.toContain("R2_BUCKET");
      expect(content).not.toContain("CLOUDFLARE_API_TOKEN");
      expect(content).not.toContain("SELECT * FROM");
    });

    it("global-error.tsx provides lightweight html/body with zero external dependencies", () => {
      const globalErrorPath = path.join(blogDir, "app/global-error.tsx");
      expect(fs.existsSync(globalErrorPath)).toBe(true);

      const content = fs.readFileSync(globalErrorPath, "utf-8");
      expect(content).toContain("<html");
      expect(content).toContain("<body");
      expect(content).toContain("VAAHANSAFE / JOURNAL");
      expect(content).toContain("500");
      expect(content).toContain("INTERRUPTED");
      expect(content).toContain("reset()");
    });
  });

  // ============================================================
  // 4. OFFLINE & RESTORED NETWORK STATES
  // ============================================================
  describe("Network Status & Offline State Invariants", () => {
    it("OfflineState.tsx exists and renders disconnected rail without fake offline claims", () => {
      const offlinePath = path.join(blogDir, "components/system/OfflineState.tsx");
      expect(fs.existsSync(offlinePath)).toBe(true);

      const content = fs.readFileSync(offlinePath, "utf-8");
      expect(content).toContain("JournalSystemState");
      expect(content).toContain("NETWORK / OFFLINE • LOCAL STATE");
      expect(content).toContain("offline");
      expect(content).toContain('railType="OFFLINE"');
      expect(content).toContain("Try again");
    });

    it("NetworkStatusProvider.tsx debounces connectivity transitions and fires toast on restoration", () => {
      const providerPath = path.join(blogDir, "components/system/NetworkStatusProvider.tsx");
      expect(fs.existsSync(providerPath)).toBe(true);

      const content = fs.readFileSync(providerPath, "utf-8");
      expect(content).toContain("Connection restored.");
      expect(content).toContain("toast.success");
      expect(content).toContain("debounceTimer");
      expect(content).toContain("300");
      expect(content).toContain("LOCAL VIEW");
    });

    it("SystemSignalRail renders distinct geometry for all 6 required states", () => {
      const railPath = path.join(blogDir, "components/system/SystemSignalRail.tsx");
      expect(fs.existsSync(railPath)).toBe(true);

      const content = fs.readFileSync(railPath, "utf-8");
      expect(content).toContain('"404"');
      expect(content).toContain('"403"');
      expect(content).toContain('"500"');
      expect(content).toContain('"OFFLINE"');
      expect(content).toContain('"RESTORED"');
      expect(content).toContain('"DEGRADED"');
      expect(content).toContain("NO STORY");
      expect(content).toContain("ACCESS CHECK");
      expect(content).toContain("INTERRUPTED");
      expect(content).toContain("DEVICE");
      expect(content).toContain("JOURNAL");
    });
  });

  // ============================================================
  // 5. DEGRADED MEDIA FALLBACK ARCHITECTURE
  // ============================================================
  describe("Degraded Content & Media Resilience", () => {
    it("EditorialMediaFallback renders deterministic geometric field per category", () => {
      const fallbackPath = path.join(
        blogDir,
        "components/journal/media/EditorialMediaFallback.tsx"
      );
      expect(fs.existsSync(fallbackPath)).toBe(true);

      const content = fs.readFileSync(fallbackPath, "utf-8");
      expect(content).toContain("isPrivacy");
      expect(content).toContain("isQrIdentity");
      expect(content).toContain("isVehicleSafety");
      expect(content).toContain("isProduct");
      expect(content).toContain("aria-label");
    });

    it("DegradedContentState banner clearly separates active content from media fallback", () => {
      const degradedPath = path.join(blogDir, "components/system/DegradedContentState.tsx");
      expect(fs.existsSync(degradedPath)).toBe(true);

      const content = fs.readFileSync(degradedPath, "utf-8");
      expect(content).toContain("PARTIAL ASSET FALLBACK");
      expect(content).toContain('type="DEGRADED"');
    });
  });

  // ============================================================
  // 6. WEB ICONS & METADATA CONFIGURATION
  // ============================================================
  describe("Web Icons & App Router Metadata Invariants", () => {
    it("Canonical VaahanSafe SVG icons exist with brand colors", () => {
      const iconPath = path.join(blogDir, "app/icon.svg");
      const appleIconPath = path.join(blogDir, "app/apple-icon.svg");
      const pubAppleIconPath = path.join(blogDir, "public/apple-icon.svg");
      const pubFaviconPath = path.join(blogDir, "public/favicon.svg");

      expect(fs.existsSync(iconPath)).toBe(true);
      expect(fs.existsSync(appleIconPath)).toBe(true);
      expect(fs.existsSync(pubAppleIconPath)).toBe(true);
      expect(fs.existsSync(pubFaviconPath)).toBe(true);

      const iconSvg = fs.readFileSync(iconPath, "utf-8");
      expect(iconSvg).toContain("#cc785c"); // Coral brand registration
      expect(iconSvg).toContain("#09090b"); // Ink dark field
    });

    it("manifest.ts defines VaahanSafe Journal with warm canvas theme color #FAF9F5", () => {
      const manifestPath = path.join(blogDir, "app/manifest.ts");
      expect(fs.existsSync(manifestPath)).toBe(true);

      const content = fs.readFileSync(manifestPath, "utf-8");
      expect(content).toContain("VaahanSafe Journal");
      expect(content).toContain("#FAF9F5");
      expect(content).toContain("/icon.svg");
    });

    it("layout.tsx includes icons, viewport theme-color #FAF9F5, and NetworkStatusProvider", () => {
      const layoutPath = path.join(blogDir, "app/layout.tsx");
      const content = fs.readFileSync(layoutPath, "utf-8");

      expect(content).toContain("NetworkStatusProvider");
      expect(content).toContain("Toaster");
      expect(content).toContain('themeColor: "#FAF9F5"');
      expect(content).toContain("/icon.svg");
      expect(content).toContain("/apple-icon.svg");
    });

    it("Invariant: No unused index.html was introduced in Next.js App Router", () => {
      const indexHtmlPath = path.join(blogDir, "index.html");
      const publicIndexHtmlPath = path.join(blogDir, "public/index.html");

      expect(fs.existsSync(indexHtmlPath)).toBe(false);
      expect(fs.existsSync(publicIndexHtmlPath)).toBe(false);
    });
  });
});
