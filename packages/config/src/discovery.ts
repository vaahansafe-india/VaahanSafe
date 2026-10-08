import type { MetadataRoute } from "next";
import { SURFACES, type SurfaceId } from "./surfaces";

export const DISCOVERY_PATHS = [
  "/robots.txt",
  "/robot.txt",
  "/sitemap.xml",
  "/sites.xml",
  "/rss.xml",
] as const;

export function isDiscoveryPath(path: string): boolean {
  return (DISCOVERY_PATHS as readonly string[]).includes(path);
}

export function discoveryOrigin(surface: SurfaceId): string {
  // The public web deployment redirects the apex to its canonical www host.
  return surface === "web"
    ? "https://www.vaahansafe.com"
    : SURFACES[surface].productionOrigin;
}

export function canIndexSurface(surface: SurfaceId): boolean {
  return (
    SURFACES[surface].indexingPolicy === "INDEX" &&
    (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production")
  );
}

export function discoveryRobots(surface: SurfaceId): MetadataRoute.Robots {
  if (!canIndexSurface(surface))
    return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/design-system",
        "/search",
        "/drafts/",
        "/admin/",
      ],
    },
    sitemap: `${discoveryOrigin(surface)}/sitemap.xml`,
    host: discoveryOrigin(surface),
  };
}

export function discoveryRedirect(location: string): Response {
  return new Response(null, {
    status: 308,
    headers: {
      Location: location,
      "Cache-Control": "public, max-age=3600",
      "X-Robots-Tag": "noindex",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function validDiscoveryDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.getTime() <= Date.now()
    ? date
    : undefined;
}

export function escapeXml(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface RssItem {
  title: string;
  url: string;
  description: string;
  publishedAt: string;
  updatedAt?: string | null;
  category?: string;
  creator?: string;
}

export function rssResponse(feed: {
  title: string;
  description: string;
  origin: string;
  items: readonly RssItem[];
}): Response {
  const items = feed.items
    .filter((item) => validDiscoveryDate(item.publishedAt))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, 50);
  const dates = items
    .map(
      (item) =>
        validDiscoveryDate(item.updatedAt) ??
        validDiscoveryDate(item.publishedAt)!,
    )
    .sort((a, b) => b.getTime() - a.getTime());
  const latest = dates[0];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
<title>${escapeXml(feed.title)}</title>
<link>${escapeXml(feed.origin)}</link>
<description>${escapeXml(feed.description)}</description>
<language>en-IN</language>
<ttl>5</ttl>
<atom:link href="${escapeXml(feed.origin)}/rss.xml" rel="self" type="application/rss+xml"/>
${latest ? `<lastBuildDate>${latest.toUTCString()}</lastBuildDate>` : ""}
${items
  .map(
    (item) => `<item>
<title>${escapeXml(item.title)}</title>
<link>${escapeXml(item.url)}</link>
<guid isPermaLink="true">${escapeXml(item.url)}</guid>
<description>${escapeXml(item.description)}</description>
<pubDate>${validDiscoveryDate(item.publishedAt)!.toUTCString()}</pubDate>
${item.category ? `<category>${escapeXml(item.category)}</category>` : ""}
${item.creator ? `<dc:creator>${escapeXml(item.creator)}</dc:creator>` : ""}
</item>`,
  )
  .join("\n")}
</channel>
</rss>`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=300",
      "X-Content-Type-Options": "nosniff",
      ...(latest ? { "Last-Modified": latest.toUTCString() } : {}),
    },
  });
}

export function discoveryUnavailable(): Response {
  return new Response(
    "Public updates are temporarily unavailable. Please try again shortly.",
    {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "Retry-After": "300",
        "X-Robots-Tag": "noindex",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
