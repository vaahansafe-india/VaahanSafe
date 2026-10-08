import { discoveryRedirect } from "@vaahansafe/config";

export const dynamic = "force-static";

export function GET() {
  return discoveryRedirect("/sitemap.xml");
}
