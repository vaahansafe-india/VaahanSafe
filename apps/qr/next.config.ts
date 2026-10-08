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
    "@vaahansafe/validation",
    "@vaahansafe/security",
    "@vaahansafe/observability",
    "@vaahansafe/qr-core",
    "@vaahansafe/database",
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        child_process: false,
        dns: false,
        net: false,
        tls: false,
        "node:fs": false,
        "node:path": false,
        "node:child_process": false,
        "node:dns": false,
        "node:net": false,
        "node:tls": false,
      };
    }
    return config;
  },
};

export default nextConfig;
