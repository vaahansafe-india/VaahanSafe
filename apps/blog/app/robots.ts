import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/drafts/", "/admin/"],
    },
    sitemap: "https://blog.vaahansafe.com/sitemap.xml",
  };
}
