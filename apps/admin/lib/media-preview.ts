import type { AdminRow } from "./contracts";
export function publicMediaPreview(
  row: AdminRow,
  baseUrl: string | undefined,
): string | null {
  if (
    row.visibility !== "PUBLIC" ||
    row.status !== "READY" ||
    typeof row.public_url !== "string"
  )
    return null;
  try {
    const asset = new URL(row.public_url),
      base = new URL(baseUrl || "");
    if (
      asset.protocol !== "https:" ||
      asset.username ||
      asset.password ||
      asset.origin !== base.origin ||
      !asset.pathname.startsWith(`${base.pathname.replace(/\/$/, "")}/`)
    )
      return null;
    return asset.href;
  } catch {
    return null;
  }
}
