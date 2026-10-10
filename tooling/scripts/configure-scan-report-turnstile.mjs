import { readFileSync, writeFileSync } from "node:fs";
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
const env = parse(readFileSync(".env", "utf8"));
const base = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/challenges/widgets`;
const headers = {
  Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
  "Content-Type": "application/json",
};
const response = await fetch(base, { headers });
const list = await response.json();
console.log("Turnstile inspection", {
  http: response.status,
  success: list.success,
  widgets: list.result?.map((w) => ({
    name: w.name,
    domains: w.domains,
    mode: w.mode,
  })),
});
if (!list.success) throw new Error("Turnstile inspection unavailable");
if (process.argv.includes("--apply")) {
  let widget = list.result.find((w) =>
    w.domains?.includes("qr.vaahansafe.com"),
  );
  if (widget) {
    const r = await fetch(`${base}/${widget.sitekey}`, { headers });
    const d = await r.json();
    if (!d.success) throw new Error("Existing widget unavailable");
    widget = d.result;
  } else {
    const r = await fetch(base, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "VaahanSafe QR scan reports",
        domains: ["qr.vaahansafe.com"],
        mode: "managed",
        bot_fight_mode: false,
      }),
    });
    const d = await r.json();
    if (!d.success) {
      console.log("Turnstile creation diagnostic", {
        http: r.status,
        errors: d.errors,
      });
      throw new Error("Could not configure report protection");
    }
    widget = d.result;
  }
  if (!widget.sitekey || !widget.secret)
    throw new Error("Turnstile credentials unavailable");
  // Use only after approval to add the requested development hostname.
  if (process.argv.includes("--allow-localhost") && !widget.domains.includes("localhost")) {
    const body = { name: widget.name, mode: widget.mode, domains: [...widget.domains, "localhost"] };
    for (const key of ["bot_fight_mode", "clearance_level", "offlabel", "ephemeral_id"])
      if (widget[key] !== undefined) body[key] = widget[key];
    const changed = await fetch(`${base}/${widget.sitekey}`, { method: "PUT", headers, body: JSON.stringify(body) });
    const result = await changed.json();
    if (!result.success) {
      console.log("Hostname configuration failed", { http: changed.status, codes: result.errors?.map(error => error.code) });
      throw new Error("Could not enable the approved localhost hostname");
    }
    const verified = await fetch(`${base}/${widget.sitekey}`, { headers }).then(response => response.json());
    if (!verified.success || !verified.result.domains.includes("localhost")
      || !verified.result.domains.includes("qr.vaahansafe.com") || verified.result.mode !== widget.mode
      || verified.result.sitekey !== widget.sitekey || verified.result.secret !== widget.secret)
      throw new Error("Updated widget verification failed");
    widget = verified.result;
  }
  for (const path of ["apps/qr/.env.local", "apps/qr/.env.production"]) {
    let text = readFileSync(path, "utf8");
    for (const [key, value] of Object.entries({
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: widget.sitekey,
      TURNSTILE_SITE_KEY: widget.sitekey,
      TURNSTILE_SECRET_KEY: widget.secret,
    })) {
      const regex = new RegExp(`^${key}=.*$`, "m");
      text = regex.test(text)
        ? text.replace(regex, () => `${key}=${value}`)
        : `${text.trimEnd()}\n${key}=${value}\n`;
    }
    writeFileSync(path, text);
  }
  console.log("QR Turnstile configured", {
    name: widget.name,
    domains: widget.domains,
    mode: widget.mode,
  });
}
