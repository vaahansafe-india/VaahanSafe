import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow local QA builds without replacing a running development server's output.
  distDir: process.env.VAAHANSAFE_NEXT_DIST_DIR || ".next",
  transpilePackages: [
    "@vaahansafe/ui",
    "@vaahansafe/icons",
    "@vaahansafe/config",
    "@vaahansafe/content",
    "@vaahansafe/types",
    "@vaahansafe/validation",
    "@vaahansafe/security",
    "@vaahansafe/observability",
  ],
};

export default nextConfig;
