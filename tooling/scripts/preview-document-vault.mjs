import nextEnv from "@next/env";
import { cpSync } from "node:fs";
import { createRequire } from "node:module";
nextEnv.loadEnvConfig("apps/customer", true);
cpSync(
  "apps/customer/public",
  "apps/customer/.next/standalone/apps/customer/public",
  { recursive: true },
);
cpSync(
  "apps/customer/.next/static",
  "apps/customer/.next/standalone/apps/customer/.next/static",
  { recursive: true },
);
process.env.PORT = "3101";
process.env.HOSTNAME = "127.0.0.1";
createRequire(import.meta.url)(
  "../../apps/customer/.next/standalone/apps/customer/server.js",
);
