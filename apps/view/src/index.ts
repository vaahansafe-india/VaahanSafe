import { renderShell } from "./shell";

export interface ViewerReport {
  reason: "PARKING" | "EMERGENCY" | "LIGHTS_ON" | "DAMAGE" | "OTHER";
  vehicleReference: string;
  reportReference: string;
  reportedAt: string;
  expiresAt: string;
  issuedAt: string;
  note: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    capturedAt: string;
  } | null;
  photos: { key: string; mimeType: string; size: number }[];
  reportId: string;
}
export interface ViewerEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ASSETS: { fetch(request: Request): Promise<Response> };
  REPORT_PHOTOS: {
    get(key: string): Promise<{ body: ReadableStream; size: number } | null>;
  };
  VIEW_RATE_LIMITER: {
    limit(options: { key: string }): Promise<{ success: boolean }>;
  };
}
export const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy":
    "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' blob:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'; object-src 'none'",
};
export async function tokenHash(token: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
async function resolveReport(
  env: ViewerEnv,
  token: string,
): Promise<ViewerReport | null> {
  if (
    !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(env.SUPABASE_URL) ||
    !env.SUPABASE_SERVICE_ROLE_KEY
  )
    throw new Error("Viewer service configuration unavailable");
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/rpc/resolve_qr_report_view_link`,
    {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_token_hash: await tokenHash(token) }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error("Viewer database unavailable");
  const report = (await response.json()) as ViewerReport | null;
  if (
    !report ||
    !Number.isFinite(Date.parse(report.expiresAt)) ||
    Date.parse(report.expiresAt) <= Date.now()
  )
    return null;
  return report;
}
async function readToken(request: Request): Promise<string | null> {
  if (
    !request.headers.get("content-type")?.startsWith("application/json") ||
    !request.body
  )
    return null;
  const reader = request.body.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const item = await reader.read();
    if (item.done) break;
    size += item.value.length;
    if (size > 256) {
      await reader.cancel();
      return null;
    }
    chunks.push(item.value);
  }
  const bytes = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, at);
    at += chunk.length;
  }
  try {
    const data = JSON.parse(new TextDecoder().decode(bytes));
    return typeof data?.token === "string" &&
      /^[A-Za-z0-9_-]{43}$/.test(data.token)
      ? data.token
      : null;
  } catch {
    return null;
  }
}
export async function handleRequest(
  request: Request,
  env: ViewerEnv,
): Promise<Response> {
  const url = new URL(request.url);
  const json = (
    body: unknown,
    status = 200,
    extra: Record<string, string> = {},
  ) =>
    Response.json(body, { status, headers: { ...PRIVATE_HEADERS, ...extra } });
  if (url.pathname === "/robots.txt")
    return new Response("User-agent: *\nDisallow: /\n", {
      headers: { ...PRIVATE_HEADERS, "Content-Type": "text/plain" },
    });
  if (request.method === "GET" || request.method === "HEAD") {
    if (url.pathname === "/" || url.pathname === "/r")
      return new Response(
        request.method === "HEAD" ? null : renderShell(url.pathname === "/"),
        {
          headers: {
            ...PRIVATE_HEADERS,
            "Content-Type": "text/html; charset=utf-8",
          },
        },
      );
    if (
      /^\/(viewer\.(css|js)|favicon\.svg|fonts\/[a-zA-Z0-9._-]+|art\/(care-illustration|paper-texture)\.webp)$/.test(
        url.pathname,
      )
    )
      return env.ASSETS.fetch(request);
    return json({ error: "This page is unavailable." }, 404);
  }
  const photo = /^\/api\/photos\/([0-2])$/.exec(url.pathname);
  if (request.method !== "POST" || (url.pathname !== "/api/report" && !photo))
    return json({ error: "This request is unavailable." }, 405);
  const origin = request.headers.get("origin");
  if (
    origin &&
    origin !== url.origin &&
    origin !== "https://view.vaahansafe.com"
  )
    return json({ error: "Open the report from your original link." }, 403);
  try {
    // Hash before using the platform rate limiter; never persist client IPs.
    if (!env.VIEW_RATE_LIMITER)
      throw new Error("Viewer protection unavailable");
    const limited = await env.VIEW_RATE_LIMITER.limit({
      key: await tokenHash(
        request.headers.get("cf-connecting-ip") || "unknown",
      ),
    });
    if (!limited.success)
      return json({ error: "Please wait a moment, then try again." }, 429, {
        "Retry-After": "60",
      });
    const token = await readToken(request);
    if (!token)
      return json(
        { error: "This link has expired or is no longer available." },
        410,
      );
    const report = await resolveReport(env, token);
    if (!report)
      return json(
        { error: "This link has expired or is no longer available." },
        410,
      );
    if (photo) {
      const item = report.photos[Number(photo[1])];
      if (
        !item ||
        !/^report_[a-f0-9-]{36}$/.test(report.reportId) ||
        !new RegExp(
          `^scan-reports/${report.reportId}/[0-2]\\.(jpg|png|webp)$`,
        ).test(item.key) ||
        !["image/jpeg", "image/png", "image/webp"].includes(item.mimeType)
      )
        return json({ error: "Photo unavailable." }, 404);
      const object = await env.REPORT_PHOTOS.get(item.key);
      if (!object)
        return json({ error: "Photo unavailable. Please try again." }, 404);
      if (object.size !== item.size || object.size > 1048576)
        throw new Error("Invalid report photo");
      return new Response(object.body, {
        headers: {
          ...PRIVATE_HEADERS,
          "Content-Type": item.mimeType,
          "Content-Disposition": "inline",
          "Content-Length": String(object.size),
        },
      });
    }
    // Storage keys, internal IDs, grant IDs and recipient identities stay server-side.
    const { photos, reportId, ...projection } = report;
    return json({ ...projection, photoCount: photos.length });
  } catch {
    console.warn("[ReportViewer] Report access unavailable");
    return json(
      { error: "We couldn’t open this report right now. Please try again." },
      503,
    );
  }
}
export default { fetch: handleRequest };
