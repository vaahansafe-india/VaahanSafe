import { readFileSync } from "node:fs";
import { build } from "esbuild";
import { Miniflare, Log, LogLevel, convertV4MiniflareOptions } from "miniflare";
const parse = (path) => Object.fromEntries(readFileSync(path, "utf8").split(/\r?\n/).filter((line) => /^\w+=/.test(line)).map((line) => {
  const i=line.indexOf("=");return [line.slice(0,i),line.slice(i+1).replace(/^["']|["']$/g,"")];
}));
const root = parse(".env"), customer = { ...root, ...parse("apps/customer/.env.production") };
const result = await build({ stdin: { contents: `import {probeCapability} from './infrastructure/cloudflare/workers/supabase-keepalive/src/service-monitoring';
export default { async fetch(request,env) { return Response.json(await probeCapability(new URL(request.url).pathname.slice(1),env)); } };`,
  resolveDir: process.cwd(), sourcefile: "monitor-runtime-entry.ts", loader: "ts" }, bundle: true, write: false, format: "esm", platform: "browser" });
const bindings = { SUPABASE_URL: customer.NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY: customer.SUPABASE_SERVICE_ROLE_KEY,
  ...Object.fromEntries(["PAYMENT_PROVIDER","RAZORPAY_MODE","RAZORPAY_KEY_ID","RAZORPAY_KEY_SECRET","MSG91_AUTH_KEY","MSG91_WHATSAPP_NUMBER","MSG91_WHATSAPP_NAMESPACE"].map((key) => [key,customer[key]])) };
console.log("Runtime binding availability", Object.fromEntries(Object.entries(bindings).map(([key,value]) => [key, typeof value === "string" && value.length>0])));
const runtime = new Miniflare(convertV4MiniflareOptions({ workers: [{ name: "capability-runtime-check", script: result.outputFiles[0].text, modules: true, bindings,
  compatibilityDate: "2026-09-01", compatibilityFlags: ["nodejs_compat"] }], log: new Log(LogLevel.WARN) }));
try {
  for (const service of ["payments","notifications","customer-analytics"]) {
    const response = await runtime.dispatchFetch(`http://localhost/${service}`);
    console.log("Cloudflare runtime read-only probe", service, await response.json());
  }
} finally { await runtime.dispose(); }
