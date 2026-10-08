import { discoveryOrigin, discoveryRedirect } from "@vaahansafe/config";

export const dynamic = "force-static";

// Subscribe to the public Journal; this feed never enumerates account data.
export function GET() {
  return discoveryRedirect(discoveryOrigin("blog") + "/rss.xml");
}
