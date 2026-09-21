import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@vaahansafe/ui",
    "@vaahansafe/icons",
    "@vaahansafe/config",
    "@vaahansafe/types",
    "@vaahansafe/content",
    "@vaahansafe/database",
    "@vaahansafe/storage",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.vaahansafe.com",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      {
        protocol: "https",
        hostname: "*.cloudflarestorage.com",
      },
    ],
  },
};

export default nextConfig;

