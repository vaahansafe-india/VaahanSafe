import { afterEach, describe, expect, it, vi } from "vitest";
import { existsSync } from "node:fs";
import {
  canIndexSurface,
  discoveryRobots,
  discoveryUnavailable,
  isDiscoveryPath,
  rssResponse,
} from "../packages/config/src/discovery";
import { ALL_SURFACE_IDS } from "../packages/config/src/surfaces";
import customerSitemap from "../apps/customer/app/sitemap";
import activationSitemap from "../apps/activate/app/sitemap";
import qrSitemap from "../apps/qr/app/sitemap";
import adminSitemap from "../apps/admin/app/sitemap";
import apiSitemap from "../apps/api/app/sitemap";

afterEach(() => vi.unstubAllEnvs());

describe("public discovery boundaries", () => {
  it("never enumerates protected records or QR identities", () => {
    for (const sitemap of [
      customerSitemap,
      activationSitemap,
      qrSitemap,
      adminSitemap,
      apiSitemap,
    ])
      expect(sitemap()).toEqual([]);
    for (const surface of [
      "customer",
      "activate",
      "qr",
      "admin",
      "api",
    ] as const) {
      expect(canIndexSurface(surface)).toBe(false);
      expect(discoveryRobots(surface).rules).toEqual({
        userAgent: "*",
        disallow: "/",
      });
    }
  });

  it("disables discovery for preview deployments", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    for (const surface of ALL_SURFACE_IDS) {
      expect(canIndexSurface(surface)).toBe(false);
      expect(discoveryRobots(surface).sitemap).toBeUndefined();
    }
  });

  it("bypasses session redirects only for exact discovery paths", () => {
    expect(isDiscoveryPath("/rss.xml")).toBe(true);
    expect(isDiscoveryPath("/sites.xml")).toBe(true);
    for (const path of [
      "/rss.xml/orders",
      "/sitemap.xml/vehicles",
      "/robot.txt/admin",
      "/api/rss.xml",
      "/vehicles",
    ])
      expect(isDiscoveryPath(path)).toBe(false);
  });

  it("provides all requested endpoints on every app", () => {
    for (const surface of ALL_SURFACE_IDS) {
      for (const path of [
        "robots.ts",
        "sitemap.ts",
        "rss.xml/route.ts",
        "sites.xml/route.ts",
        "robot.txt/route.ts",
      ])
        expect(existsSync(`apps/${surface}/app/${path}`)).toBe(true);
    }
  });
});

describe("RSS integrity", () => {
  it("escapes hostile titles, descriptions, URLs, and invalid XML controls", async () => {
    const response = rssResponse({
      title: "A & B",
      description: "Public updates",
      origin: "https://blog.vaahansafe.com",
      items: [
        {
          title: "</title><script>bad</script>",
          description: "quote ]]> & <tag>\u0001",
          url: "https://blog.vaahansafe.com/articles/a?x=1&y=2",
          publishedAt: "2026-01-01T00:00:00Z",
          creator: "Writer & editor",
        },
      ],
    });
    const xml = await response.text();
    expect(xml).not.toContain("<script>");
    expect(xml).not.toContain("\u0001");
    expect(xml).toContain("&lt;/title&gt;");
    expect(xml).toContain("x=1&amp;y=2");
    expect(xml).toContain("<dc:creator>Writer &amp; editor</dc:creator>");
    expect(response.headers.get("Content-Type")).toBe(
      "application/rss+xml; charset=utf-8",
    );
  });

  it("omits future and invalid publications without inventing update dates", async () => {
    const response = rssResponse({
      title: "Feed",
      description: "Updates",
      origin: "https://blog.vaahansafe.com",
      items: [
        {
          title: "Future",
          description: "",
          url: "https://blog.vaahansafe.com/future",
          publishedAt: "2999-01-01",
        },
        {
          title: "Invalid",
          description: "",
          url: "https://blog.vaahansafe.com/invalid",
          publishedAt: "not-a-date",
        },
      ],
    });
    const xml = await response.text();
    expect(xml).not.toContain("<item>");
    expect(xml).not.toContain("<lastBuildDate>");
    expect(response.headers.has("Last-Modified")).toBe(false);
  });

  it("returns a retryable failure instead of a fabricated empty feed", async () => {
    const response = discoveryUnavailable();
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Retry-After")).toBe("300");
    expect(await response.text()).not.toContain("<rss");
  });
});
