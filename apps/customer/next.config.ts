import type { NextConfig } from "next";
import path from "node:path";

const isVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  ...(isVercel
    ? {}
    : {
        output: "standalone",
        outputFileTracingRoot: path.join(__dirname, "../../"),
      }),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  transpilePackages: [
    "@vaahansafe/ui",
    "@vaahansafe/icons",
    "@vaahansafe/config",
    "@vaahansafe/types",
    "@vaahansafe/validation",
    "@vaahansafe/security",
    "@vaahansafe/observability",
    "@vaahansafe/auth",
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
