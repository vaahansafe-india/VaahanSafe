import {
  detectMime,
  MAX_FILE_BYTES,
  safeFilename,
} from "../../../../../apps/customer/features/document-vault/model";
interface Stored {
  body: ReadableStream;
  size: number;
  httpEtag: string;
  range?: { offset: number; length: number };
}
export interface VaultEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  CUSTOMER_ORIGIN: string;
  CUSTOMER_ADDITIONAL_ORIGINS?: string;
  DOCUMENT_STORAGE: {
    put(key: string, data: Uint8Array, options: unknown): Promise<unknown>;
    get(key: string, options?: unknown): Promise<Stored | null>;
    delete(key: string | string[]): Promise<void>;
  };
}
async function hash(value: string | Uint8Array) {
  const bytes =
    typeof value === "string" ? new TextEncoder().encode(value) : value;
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", bytes as BufferSource),
    ),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
}
async function rpc<T extends Record<string, unknown> | unknown[]>(
  env: VaultEnv,
  name: string,
  body: unknown,
): Promise<T> {
  const res = await fetch(
    `${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/rpc/${name}`,
    {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!res.ok) throw new Error("Database unavailable");
  const data = (await res.json()) as T;
  return data;
}
async function bounded(request: Request, limit: number) {
  if (Number(request.headers.get("content-length")) > limit)
    throw new Error("Invalid file");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Invalid file");
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      void reader.cancel();
      reject(new Error("Upload timed out"));
    }, 300000);
  });
  try {
    let length = 0;
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await Promise.race([reader.read(), timeout]);
      if (done) break;
      length += value.byteLength;
      if (length > limit) {
        await reader.cancel();
        throw new Error("Invalid file");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let at = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, at);
      at += chunk.length;
    }
    return bytes;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
export async function cleanup(env: VaultEnv) {
  const rows = await rpc<Array<{ id: string; key: string; thumbnail: string }>>(
    env,
    "vault_cleanup",
    { p_id: null },
  );
  for (const row of rows) {
    await env.DOCUMENT_STORAGE.delete([row.key, row.thumbnail]);
    await rpc(env, "vault_cleanup", { p_id: row.id });
  }
}
export async function handleRequest(
  request: Request,
  env: VaultEnv,
): Promise<Response> {
  const origin = request.headers.get("Origin");
  const allowedOrigins = [
    env.CUSTOMER_ORIGIN,
    ...(env.CUSTOMER_ADDITIONAL_ORIGINS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  ];
  const originAllowed = origin !== null && allowedOrigins.includes(origin);
  const cors: Record<string, string> = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    Vary: "Origin",
  };
  if (originAllowed) {
    cors["Access-Control-Allow-Origin"] = origin!;
    cors["Access-Control-Allow-Headers"] = "Content-Type, Range";
    cors["Access-Control-Allow-Methods"] = "GET, PUT, OPTIONS";
    cors["Access-Control-Expose-Headers"] =
      "Content-Length, Content-Range, Accept-Ranges";
  }
  const json = (data: unknown, status = 200) =>
    Response.json(data, { status, headers: cors });
  if (request.method === "OPTIONS")
    return originAllowed
      ? new Response(null, { status: 204, headers: cors })
      : json({ error: "Unavailable" }, 403);
  if (origin && !originAllowed) return json({ error: "Unavailable" }, 403);
  const url = new URL(request.url);
  const match = /^\/(uploads|access)\/([A-Za-z0-9_-]{43})$/.exec(url.pathname);
  if (!match) return json({ error: "Unavailable" }, 404);
  const tokenHash = await hash(match[2]!);
  let uploadLease: string | undefined;
  let finalizing = false;
  try {
    if (match[1] === "uploads" && request.method === "PUT") {
      if (!originAllowed) return json({ error: "Unavailable" }, 403);
      const claim = await rpc<Record<string, unknown>>(env, "vault_transfer", {
        p_hash: tokenHash,
        p_action: "claim",
        p_data: {},
      });
      if (claim.ready) return json({ id: claim.id, ready: true });
      if (claim.error)
        return json(
          {
            error: "This upload is unavailable. Please check its status.",
            code: claim.error,
          },
          409,
        );
      uploadLease = String(claim.lease);
      const bytes = await bounded(request, MAX_FILE_BYTES + 150000);
      const form = await new Response(bytes as BodyInit, {
        headers: { "Content-Type": request.headers.get("Content-Type") || "" },
      }).formData();
      const file = form.get("file");
      const thumbnail = form.get("thumbnail");
      if (!(file instanceof File)) throw new Error("Invalid file");
      const original = new Uint8Array(await file.arrayBuffer());
      const mime = detectMime(original);
      if (mime !== claim.mime || original.byteLength !== Number(claim.size))
        throw new Error("Invalid file");
      let thumb: Uint8Array | null = null;
      if (thumbnail instanceof File) {
        thumb = new Uint8Array(await thumbnail.arrayBuffer());
        if (thumb.length > 131072 || detectMime(thumb) !== "image/webp")
          throw new Error("Invalid file");
      }
      await env.DOCUMENT_STORAGE.put(String(claim.key), original, {
        httpMetadata: { contentType: mime, cacheControl: "private, no-store" },
      });
      if (thumb)
        await env.DOCUMENT_STORAGE.put(
          String(claim.key) + "-thumbnail",
          thumb,
          {
            httpMetadata: {
              contentType: "image/webp",
              cacheControl: "private, no-store",
            },
          },
        );
      // A failed/ambiguous finalize never deletes the objects: the cleanup lease
      // handles orphans and replay returns READY if the transaction already committed.
      finalizing = true;
      const result = await rpc(env, "vault_transfer", {
        p_hash: tokenHash,
        p_action: "finish",
        p_data: {
          lease: claim.lease,
          size: original.length,
          mime,
          checksum: await hash(original),
          thumbnail: !!thumb,
        },
      });
      return "error" in result
        ? json(
            {
              error:
                "We could not confirm this upload. Please check its status.",
              code: result.error,
            },
            409,
          )
        : json(result);
    }
    if (match[1] === "uploads" && request.method === "GET") {
      const state = await rpc(env, "vault_transfer", {
        p_hash: tokenHash,
        p_action: "state",
        p_data: {},
      });
      return json(state, "error" in state ? 409 : 200);
    }
    if (match[1] === "access" && request.method === "GET") {
      const grant = await rpc<Record<string, unknown>>(env, "vault_transfer", {
        p_hash: tokenHash,
        p_action: "read",
        p_data: {},
      });
      if (grant.error || !grant.key)
        return json(
          { error: "Document access expired. Open it again from VaahanSafe." },
          403,
        );
      const range = request.headers.get("Range");
      if (range && !/^bytes=\d*-\d*$/.test(range))
        return json({ error: "Invalid range" }, 416);
      const object = await env.DOCUMENT_STORAGE.get(
        String(grant.key),
        range ? { range: request.headers } : undefined,
      );
      if (!object)
        return json({ error: "Document unavailable. Please try again." }, 404);
      const headers: Record<string, string> = {
        ...cors,
        "Content-Type": String(grant.mime),
        "Content-Length": String(object.range?.length ?? object.size),
        "Accept-Ranges": "bytes",
        "Content-Disposition": `${grant.kind === "download" ? "attachment" : "inline"}; filename="document"; filename*=UTF-8''${encodeURIComponent(safeFilename(String(grant.filename))).replace(/'/g, "%27")}`,
        "Content-Security-Policy": "default-src 'none'; sandbox",
      };
      if (object.range)
        headers["Content-Range"] =
          `bytes ${object.range.offset}-${object.range.offset + object.range.length - 1}/${object.size}`;
      return new Response(object.body, {
        status: object.range ? 206 : 200,
        headers,
      });
    }
    return json({ error: "Unavailable" }, 405);
  } catch {
    if (uploadLease && !finalizing) {
      try {
        await rpc(env, "vault_fail_upload", {
          p_hash: tokenHash,
          p_lease: uploadLease,
        });
      } catch {
        /* The cleanup lease handles unavailable metadata services. */
      }
    }
    return json(
      {
        error:
          "We couldn’t complete this document action right now. Please check the upload status before retrying.",
      },
      503,
    );
  }
}
export default {
  fetch: handleRequest,
  async scheduled(_event: unknown, env: VaultEnv) {
    await cleanup(env);
  },
};
