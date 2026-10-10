import { build } from "esbuild";
const result = await build({ entryPoints: ["tooling/scripts/verify-service-monitoring.ts"],
  bundle: true, write: false, platform: "node", format: "esm", target: "node22" });
await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
