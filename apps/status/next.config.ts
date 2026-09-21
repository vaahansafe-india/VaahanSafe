import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@vaahansafe/ui",
    "@vaahansafe/icons",
    "@vaahansafe/config",
    "@vaahansafe/types",
    "@vaahansafe/observability",
    "@vaahansafe/status-core",
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
