import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

const targetArg = process.argv[2];
const cwd = process.cwd();

// Detect target application:
// 1. Explicit CLI argument: "customer" | "web" | "all"
// 2. APP_NAME environment variable
// 3. Domain path detection (Hostinger creates paths like /home/.../domains/app.vaahansafe.com/...)
let target = targetArg || process.env.APP_NAME;

if (!target) {
  if (cwd.includes("app.vaahansafe.com") || __dirname.includes("app.vaahansafe.com")) {
    target = "customer";
  } else if (cwd.includes("vaahansafe.com") && !cwd.includes("app.vaahansafe.com")) {
    target = "web";
  } else {
    target = "all";
  }
}

console.log(`[build-hostinger] Starting Hostinger build pipeline (target: ${target}, cwd: ${cwd})...`);

function run(cmd) {
  console.log(`[build-hostinger] Executing: ${cmd}`);
  execSync(cmd, { cwd: rootDir, stdio: "inherit" });
}

try {
  if (target === "customer") {
    console.log("[build-hostinger] Building Customer SSR App (@vaahansafe/customer)...");
    run("npx turbo run build --filter=@vaahansafe/customer");
    run("node tooling/scripts/prepare-customer.mjs");
  } else if (target === "web") {
    console.log("[build-hostinger] Building Web Static Portal (@vaahansafe/web)...");
    run("npx turbo run build --filter=@vaahansafe/web");
    run("node tooling/scripts/prepare-hostinger.mjs");
  } else {
    console.log("[build-hostinger] Building both @vaahansafe/web and @vaahansafe/customer sequentially...");
    run("npx turbo run build --filter=@vaahansafe/web");
    run("node tooling/scripts/prepare-hostinger.mjs");
    run("npx turbo run build --filter=@vaahansafe/customer");
    run("node tooling/scripts/prepare-customer.mjs");
  }

  console.log("[build-hostinger] Build pipeline completed successfully!");
} catch (err) {
  console.error("[build-hostinger] Build pipeline failed:", err.message);
  process.exit(1);
}
