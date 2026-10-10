import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
const root = Object.fromEntries(readFileSync(".env", "utf8").split(/\r?\n/).filter((line) => /^\w+=/.test(line)).map((line) => {
  const i = line.indexOf("="); return [line.slice(0, i), line.slice(i + 1).replace(/^["']|["']$/g, "")];
}));
const child = spawn(process.execPath, ["node_modules/wrangler/bin/wrangler.js", "tail", "--format", "json", "--config", "infrastructure/cloudflare/workers/supabase-keepalive/wrangler.toml"], {
  env: { ...process.env, CLOUDFLARE_API_TOKEN: root.CLOUDFLARE_API_TOKEN }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
});
let buffer = "";
child.stdout.on("data", (chunk) => {
  buffer += chunk;
  // Wrangler emits pretty-printed JSON events separated by balanced top-level braces.
  const pieces = buffer.split(/\n(?=\{)/); buffer = pieces.pop() ?? "";
  for (const piece of pieces) show(piece);
  try { JSON.parse(buffer); show(buffer); buffer = ""; } catch { /* Wait for the rest of an event. */ }
});
function show(piece) {
  try {
    const event = JSON.parse(piece);
    console.log("Worker event", { outcome: event.outcome, scheduled: event.event?.cron !== undefined });
    for (const log of event.logs ?? []) if (log.message?.[0] === "Capability probe failed") console.log(...log.message);
  } catch { /* Drop CLI chatter and private request metadata. */ }
}
child.stderr.on("data", () => {});
setTimeout(() => child.kill(), 55_000);
await new Promise((resolve) => child.on("close", resolve));
