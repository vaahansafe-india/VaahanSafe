import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@vaahansafe/ui",
    "@vaahansafe/icons",
    "@vaahansafe/config",
    "@vaahansafe/types",
    "@vaahansafe/validation",
    "@vaahansafe/security",
    "@vaahansafe/observability",
    "@vaahansafe/auth",
    "@vaahansafe/content",
    "@vaahansafe/database",
    "@vaahansafe/storage",
    "@vaahansafe/notifications",
    "@vaahansafe/qr-core",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "Cache-Control", value: "private, no-store" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
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

export default function config(phase: string): NextConfig {
  return {
    ...nextConfig,
    // A production build must not overwrite the running dev server's chunks.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  };
}
