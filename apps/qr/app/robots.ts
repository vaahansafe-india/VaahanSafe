import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const origin = "https://qr.vaahansafe.com";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/vs_*",
        "/demo-*",
      ],
    },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
