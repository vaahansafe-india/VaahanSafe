import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@vaahansafe/config",
    "@vaahansafe/types",
    "@vaahansafe/validation",
    "@vaahansafe/security",
    "@vaahansafe/observability",
    "@vaahansafe/database",
    "@vaahansafe/auth",
    "@vaahansafe/payments",
    "@vaahansafe/qr-core",
  ],
};

export default nextConfig;
