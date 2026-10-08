import type { MetadataRoute } from "next";
import {
  canIndexSurface,
  discoveryOrigin,
  validDiscoveryDate,
} from "@vaahansafe/config";
import { OFFICIAL_GUIDES } from "../lib/documents/official-guides";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!canIndexSurface("web")) return [];
  const origin = discoveryOrigin("web");
  const paths = [
    "",
    "product",
    "about",
    "contact",
    "how-it-works",
    "safety",
    "pricing",
    "gallery",
    "privacy",
    "terms",
    "refund-policy",
    "shipping-replacement",
    "safety-disclaimer",
    "shipping-policy",
    "subscription-terms",
    "cookie-policy",
    "disclaimer",
    "tour",
    "help",
    "help/replacement",
    "help/activation",
    "documents",
  ];
  return [
    ...paths.map((path) => ({
      url: `${origin}/${path}`,
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority:
        path === ""
          ? 1
          : ["product", "how-it-works", "safety", "pricing"].includes(path)
            ? 0.9
            : 0.6,
    })),
    ...OFFICIAL_GUIDES.map((guide) => ({
      url: `${origin}/documents/${encodeURIComponent(guide.slug)}`,
      lastModified: validDiscoveryDate(guide.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
