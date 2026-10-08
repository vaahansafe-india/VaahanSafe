import { discoveryRobots } from "@vaahansafe/config";

export const dynamic = "force-static";

export default function robots() {
  return discoveryRobots("web");
}
