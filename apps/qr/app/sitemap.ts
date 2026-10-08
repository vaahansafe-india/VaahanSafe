import type { MetadataRoute } from "next";

export const dynamic = "force-static";

// Private records and public QR identities are never enumerated.
export default function sitemap(): MetadataRoute.Sitemap {
  return [];
}
