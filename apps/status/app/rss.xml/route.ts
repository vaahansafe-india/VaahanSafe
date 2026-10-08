import {
  discoveryOrigin,
  discoveryUnavailable,
  rssResponse,
} from "@vaahansafe/config";
import { getDiscoveryIncidents } from "../../lib/discovery";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const origin = discoveryOrigin("status");
    const incidents = await getDiscoveryIncidents();
    return rssResponse({
      title: "VaahanSafe Service Updates",
      description:
        "Published incident reports and resolution updates for VaahanSafe services.",
      origin,
      items: incidents.map((incident) => ({
        title: `${incident.title} — ${incident.state}`,
        url: `${origin}/incidents/${encodeURIComponent(incident.slug)}`,
        description: incident.updates[0]?.message ?? incident.summary,
        publishedAt: incident.updates[0]?.publishedAt ?? incident.startedAt,
        updatedAt: incident.resolvedAt,
        category: incident.state,
      })),
    });
  } catch {
    console.error("Status RSS publication source is unavailable");
    return discoveryUnavailable();
  }
}
