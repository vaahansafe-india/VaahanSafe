import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@vaahansafe/ui",
    "@vaahansafe/icons",
    "@vaahansafe/config",
    "@vaahansafe/types",
    "@vaahansafe/observability",
  ],
};

export default nextConfig;
