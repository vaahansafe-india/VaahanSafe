import { readFileSync, writeFileSync, existsSync } from "node:fs";
const parse = (text) =>
  Object.fromEntries(
    text
      .split(/\r?\n/)
      .filter((l) => /^\w+=/.test(l))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, "")];
      }),
  );
const root = parse(readFileSync(".env", "utf8"));
const valid = (v) =>
  !!v && !/placeholder|your_|replace_with|development_|local_dev_/i.test(v);
for (const app of ["qr", "customer"])
  for (const suffix of [".env.local", ".env.production"]) {
    const path = `apps/${app}/${suffix}`;
    if (!existsSync(path)) continue;
    let text = readFileSync(path, "utf8");
    const env = parse(text);
    const updates = {
      CLOUDFLARE_R2_SCAN_REPORTS_BUCKET: "vaahansafe-prod-private",
      CLOUDFLARE_SCAN_REPORTS_API_TOKEN: root.CLOUDFLARE_API_TOKEN,
    };
    if (app === "qr")
      for (const key of [
        "SESSION_SECRET",
        "TURNSTILE_SECRET_KEY",
        "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
      ])
        if (!valid(env[key]) && valid(root[key])) updates[key] = root[key];
    if (process.argv.includes("--apply")) {
      for (const [key, value] of Object.entries(updates)) {
        if (!valid(value)) continue;
        const line = `${key}=${value}`;
        const pattern = new RegExp(`^${key}=.*$`, "m");
        text = pattern.test(text)
          ? text.replace(pattern, () => line)
          : `${text.trimEnd()}\n${line}\n`;
      }
      writeFileSync(path, text);
    }
    const final = parse(text);
    console.log(
      path,
      Object.fromEntries(
        [
          "CLOUDFLARE_ACCOUNT_ID",
          "CLOUDFLARE_SCAN_REPORTS_API_TOKEN",
          "CLOUDFLARE_R2_SCAN_REPORTS_BUCKET",
          ...(app === "qr"
            ? [
                "SESSION_SECRET",
                "TURNSTILE_SECRET_KEY",
                "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
              ]
            : []),
        ].map((key) => [key, valid(final[key]) ? "configured" : "missing"]),
      ),
    );
  }
