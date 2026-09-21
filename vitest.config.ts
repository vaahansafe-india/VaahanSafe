import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@vaahansafe/ui": path.resolve(__dirname, "./packages/ui/src"),
      "@vaahansafe/icons": path.resolve(__dirname, "./packages/icons/src"),
      "@vaahansafe/validation": path.resolve(__dirname, "./packages/validation/src"),
      "@vaahansafe/observability": path.resolve(__dirname, "./packages/observability/src"),
      "@vaahansafe/config": path.resolve(__dirname, "./packages/config/src"),
      "@vaahansafe/types": path.resolve(__dirname, "./packages/types/src"),
      "@vaahansafe/qr-core": path.resolve(__dirname, "./packages/qr/src"),
      "@vaahansafe/security": path.resolve(__dirname, "./packages/security/src"),
    },
  },
});
