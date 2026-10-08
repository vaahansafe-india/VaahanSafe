import type { MetadataRoute } from "next";
import {
  canIndexSurface,
  discoveryOrigin,
  validDiscoveryDate,
} from "@vaahansafe/config";
import { getDiscoveryIncidents } from "../lib/discovery";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!canIndexSurface("status")) return [];
  const origin = discoveryOrigin("status");
  const incidents = await getDiscoveryIncidents();
  return [
    ...["", "history", "methodology", "api-reference"].map((path) => ({
      url: `${origin}/${path}`,
    })),
    ...incidents.map((incident) => ({
      url: `${origin}/incidents/${encodeURIComponent(incident.slug)}`,
      lastModified:
        validDiscoveryDate(incident.updates[0]?.publishedAt) ??
        validDiscoveryDate(incident.resolvedAt) ??
        validDiscoveryDate(incident.startedAt),
    })),
  ];
}
