import type { NextConfig } from "next";
import path from "node:path";

const isVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  // Isolate verification builds from the running Turbopack development server.
  distDir: process.env.VAAHANSAFE_BUILD_CHECK === "1" ? ".next-qa" : ".next",
  turbopack: {},
  async headers() {
    return [
      {
        source: "/geo/india/states.:hash.geo.json",
        headers: [{key:"Cache-Control",value:"public, max-age=31536000, immutable"}],
      },
      {
        source: "/shared/documents",
        headers: [{key:"Cache-Control",value:"private, no-store"},{key:"Referrer-Policy",value:"no-referrer"}],
      },
      {
        source: "/documents/:path*",
        headers: [{key:"Cache-Control",value:"private, no-store"},{key:"Referrer-Policy",value:"no-referrer"}],
      },
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
  experimental: {
    optimizePackageImports: ["@hugeicons/core-free-icons", "@vaahansafe/ui"],
  },
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
    "@vaahansafe/database",
  ],
  // These Node module fallbacks belong to the Webpack production build.
  ...(process.env.TURBOPACK
    ? {}
    : {
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
      }),
};

export default nextConfig;
