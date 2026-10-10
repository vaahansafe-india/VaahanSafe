// Provision a dedicated server-only archive key; never print or rotate it.
import fs from "node:fs";
import { randomBytes } from "node:crypto";
const files = ["apps/admin/.env.local", "apps/admin/.env.production"];
const name = "ACTIVATION_EXPORT_ENCRYPTION_KEY_V1";
const values = files.map((file) => fs.readFileSync(file, "utf8"));
const keys = values
  .map((text) => new RegExp(`^${name}=([a-f0-9]{64})$`, "m").exec(text)?.[1])
  .filter(Boolean);
if (new Set(keys).size > 1)
  throw new Error("Archive keys differ; refusing to rotate them");
const key = keys[0] || randomBytes(32).toString("hex");
for (let i = 0; i < files.length; i++) {
  let text = values[i];
  if (!new RegExp(`^${name}=`, "m").test(text)) text += `\n${name}=${key}\n`;
  if (!/^QR_ACTIVATION_EXPORT_BUCKET=/m.test(text))
    text += "QR_ACTIVATION_EXPORT_BUCKET=vaahansafe-dev-private\n";
  fs.writeFileSync(files[i], text);
}
console.log(
  "Server-only activation archive key and existing private R2 bucket configured. No credentials displayed.",
);
