import type { MetadataRoute } from "next";

export const dynamic = "force-static";

// Public root landing page is indexed for discovery.
// Individual resolver passes (/{publicId}) are strictly NOINDEX and excluded to preserve personal safety boundaries.
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = "https://qr.vaahansafe.com";
  return [
    {
      url: `${origin}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
  ];
}
