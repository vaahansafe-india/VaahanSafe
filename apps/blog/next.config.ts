import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "@hugeicons/core-free-icons",
      "@vaahansafe/icons",
      "@vaahansafe/ui/brand",
    ],
  },
  async headers() {
    return [
      {
        source: "/fonts/:font*.woff2",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
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
