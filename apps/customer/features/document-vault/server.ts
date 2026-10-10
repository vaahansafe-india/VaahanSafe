import "server-only";
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import { getAuthenticatedCustomer } from "@/lib/session";
import {
  CATEGORIES,
  MAX_FILE_BYTES,
  MIME_TYPES,
  safeFilename,
  type VaultDocument,
  type VaultPage,
} from "./model";
const scrypt = (password: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) =>
    scryptCallback(
      password,
      salt,
      64,
      { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key)),
    ),
  );
const db = () => getAuthoritativeDatabaseClient();
export class VaultError extends Error {
  constructor(
    public code: string,
    public status = 400,
    public scope?: string,
  ) {
    super(code);
  }
}
const messages: Record<string, string> = {
  UNAUTHORIZED: "Please sign in with your verified mobile number.",
  NOT_FOUND: "This document is unavailable.",
  LOCKED: "Unlock this document to continue.",
  PIN_REQUIRED: "Set up your Vault PIN first.",
  RATE_LIMIT: "Too many attempts. Please try again in 15 minutes.",
  QUOTA:
    "Your vault limit has been reached. Remove unused files before uploading.",
  UPLOAD_PENDING:
    "An upload is still pending. Check its status before retrying.",
  INCORRECT_PASSWORD: "Incorrect PIN or password.",
  REVERIFY: "Sign in again to reset your Vault PIN.",
  SHARE_UNAVAILABLE:
    "This secure link is unavailable. It may have expired, been revoked or reached its view limit.",
  SHARE_LIMIT: "Revoke an unused link before creating another.",
};
export function vaultError(error: unknown) {
  if (!(error instanceof VaultError) || error.code === "SERVICE_UNAVAILABLE") {
    // Never log request bodies, SQL, credentials, document names or capability tokens.
    console.error("[document-vault] Service operation unavailable");
  }
  return {
    error:
      error instanceof VaultError
        ? (error.code === "LOCKED" && error.scope === "vault"
            ? "Unlock your vault with your Vault PIN to continue."
            : messages[error.code]) ||
          "Please check the document details and try again."
        : "We couldn’t complete this document action right now. Please try again.",
    code: error instanceof VaultError ? error.code : "SERVICE_UNAVAILABLE",
    ...(error instanceof VaultError && error.scope
      ? { scope: error.scope }
      : {}),
  };
}
export async function readVaultJson(
  request: Request,
  limit: number,
): Promise<Record<string, unknown>> {
  if (
    !request.body ||
    Number(request.headers.get("content-length") || 0) > limit
  )
    throw new VaultError("INVALID_INPUT");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      length += next.value.byteLength;
      if (length > limit) {
        await reader.cancel();
        throw new VaultError("INVALID_INPUT");
      }
      chunks.push(next.value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const value = JSON.parse(new TextDecoder().decode(bytes));
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new VaultError("INVALID_INPUT");
    return value;
  } catch (error) {
    if (error instanceof VaultError) throw error;
    throw new VaultError("INVALID_INPUT");
  } finally {
    reader.releaseLock();
  }
}
export function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
export function newToken() {
  return randomBytes(32).toString("base64url");
}
export function workerUrl() {
  const url = process.env.DOCUMENT_VAULT_WORKER_URL;
  if (!url || !/^https:\/\//.test(url))
    throw new VaultError("SERVICE_UNAVAILABLE", 503);
  return url.replace(/\/$/, "");
}
export async function verifier(password: string, pin = false) {
  if (
    typeof password !== "string" ||
    (pin
      ? !/^\d{6,12}$/.test(password)
      : password.length < 10 || password.length > 128)
  )
    throw new VaultError("INVALID_PASSWORD");
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt);
  return `scrypt:32768:8:1:${salt}:${key.toString("hex")}`;
}
async function matches(password: string, encoded: string) {
  if (typeof password !== "string" || password.length > 128) return false;
  const [alg, n, r, p, salt, key] = encoded.split(":");
  if (
    alg !== "scrypt" ||
    n !== "32768" ||
    r !== "8" ||
    p !== "1" ||
    !salt ||
    !key ||
    key.length !== 128
  )
    return false;
  const value = await scrypt(password, salt);
  return timingSafeEqual(value, Buffer.from(key, "hex"));
}
export async function rpc<T = Record<string, unknown>>(
  name: string,
  args: unknown[],
): Promise<T> {
  const placeholders = args.map(() => "?").join(",");
  const row = await db().queryFirst<{ result: T }>(
    `SELECT public.${name}(${placeholders}) AS result`,
    args,
  );
  const result = row?.result;
  if (!result) throw new VaultError("SERVICE_UNAVAILABLE", 503);
  if (typeof result === "object" && "error" in result)
    throw new VaultError(
      String(result.error),
      String(result.error) === "UNAUTHORIZED" ? 401 : 400,
      "scope" in result ? String(result.scope) : undefined,
    );
  return result;
}
export async function customer() {
  const auth = await getAuthenticatedCustomer();
  if (!auth || !auth.phoneVerified) throw new VaultError("UNAUTHORIZED", 401);
  return auth;
}
export function uuid(value: unknown) {
  if (
    typeof value !== "string" ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
      value,
    )
  )
    throw new VaultError("INVALID_INPUT");
  return value;
}
function text(value: unknown, max: number, required = false) {
  if (value === undefined || value === null || value === "") {
    if (required) throw new VaultError("INVALID_INPUT");
    return null;
  }
  if (typeof value !== "string" || value.length > max)
    throw new VaultError("INVALID_INPUT");
  return value.trim();
}
function date(value: unknown) {
  if (!value) return "";
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value + "T00:00:00Z")) ||
    new Date(value + "T00:00:00Z").toISOString().slice(0, 10) !== value
  )
    throw new VaultError("INVALID_DATE");
  return value;
}
function metadata(value: unknown) {
  if (!value) return {};
  if (typeof value !== "object" || Array.isArray(value))
    throw new VaultError("INVALID_INPUT");
  const allowed = [
    "notes",
    "provider",
    "policyStart",
    "certificateReference",
    "serviceCentre",
  ];
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(value)) {
    if (
      !allowed.includes(key) ||
      typeof val !== "string" ||
      val.length > (key === "notes" ? 1000 : 120)
    )
      throw new VaultError("INVALID_INPUT");
    out[key] = val.trim();
  }
  if (out.policyStart) date(out.policyStart);
  return out;
}
function mode(value: unknown) {
  if (!["ACCOUNT", "VAULT_PIN", "DOCUMENT_PASSWORD"].includes(String(value)))
    throw new VaultError("INVALID_INPUT");
  return String(value);
}
export async function command(action: string, input: Record<string, unknown>) {
  const auth = await customer();
  const run = (a: string, data: unknown = {}) =>
    rpc("vault_command", [auth.session.id, a, JSON.stringify(data)]);
  if (action === "lock") return run(action);
  if (action === "configure_pin") {
    const minutes = Number(input.minutes);
    if (![0, 5, 15, 30].includes(minutes))
      throw new VaultError("INVALID_INPUT");
    return run(action, {
      verifier: await verifier(String(input.password), true),
      minutes,
    });
  }
  if (action === "unlock") {
    const scope = input.scope === "vault" ? "vault" : uuid(input.scope);
    const sec = await run("secret", { scope });
    if (!(await matches(String(input.password), String(sec.verifier))))
      throw new VaultError("INCORRECT_PASSWORD");
    return run("unlock", { scope, verifier: sec.verifier });
  }
  if (action === "upload") {
    const size = Number(input.size);
    const mime = String(input.mime);
    if (
      !Number.isInteger(size) ||
      size < 12 ||
      size > MAX_FILE_BYTES ||
      !MIME_TYPES.includes(mime as (typeof MIME_TYPES)[number])
    )
      throw new VaultError("INVALID_FILE");
    const token = newToken();
    const data: Record<string, unknown> = {
      size,
      mime,
      filename: safeFilename(String(input.filename)),
      tokenHash: hashToken(token),
    };
    if (input.documentId) data.documentId = uuid(input.documentId);
    else {
      if (!(String(input.category) in CATEGORIES))
        throw new VaultError("INVALID_INPUT");
      const issued = date(input.issued),
        validFrom = date(input.validFrom),
        expires = date(input.expires);
      if (
        expires &&
        ((issued && issued > expires) || (validFrom && validFrom > expires))
      )
        throw new VaultError("INVALID_DATE");
      Object.assign(data, {
        category: input.category,
        title: text(input.title, 120, true),
        vehicleId: text(input.vehicleId, 100),
        issued,
        validFrom,
        expires,
        issuer: text(input.issuer, 120),
        metadata: metadata(input.metadata),
        mode: mode(input.mode),
        numberMasked: input.number
          ? `•••• ${String(text(input.number, 80)).slice(-4)}`
          : null,
      });
      if (data.mode === "DOCUMENT_PASSWORD")
        data.verifier = await verifier(String(input.password));
    }
    const result = await run(action, data);
    return { ...result, uploadUrl: `${workerUrl()}/uploads/${token}` };
  }
  const id = uuid(input.id);
  if (action === "access") {
    const kind = String(input.kind);
    if (!["preview", "download", "thumbnail"].includes(kind))
      throw new VaultError("INVALID_INPUT");
    const token = newToken();
    const result = await run(action, {
      id,
      kind,
      tokenHash: hashToken(token),
      ...(input.versionId ? { versionId: uuid(input.versionId) } : {}),
    });
    return {
      ...result,
      url: `${workerUrl()}/access/${token}`,
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    };
  }
  if (action === "edit")
    return run(action, {
      id,
      title: text(input.title, 120, true),
      expires: date(input.expires),
      issuer: text(input.issuer, 120),
      metadata: metadata(input.metadata),
    });
  if (action === "security") {
    const security = mode(input.mode);
    return run(action, {
      id,
      mode: security,
      ...(security === "DOCUMENT_PASSWORD"
        ? { verifier: await verifier(String(input.password)) }
        : {}),
    });
  }
  if (action === "share") {
    const seconds = Number(input.seconds);
    const maxViews = input.maxViews ? Number(input.maxViews) : null;
    if (
      ![900, 3600, 86400, 604800].includes(seconds) ||
      (maxViews !== null &&
        (!Number.isInteger(maxViews) || maxViews < 1 || maxViews > 1000))
    )
      throw new VaultError("INVALID_INPUT");
    if (typeof input.download !== "boolean")
      throw new VaultError("INVALID_INPUT");
    const token = newToken();
    await run(action, {
      id,
      seconds,
      maxViews,
      download: input.download,
      tokenHash: hashToken(token),
      ...(input.password
        ? { verifier: await verifier(String(input.password)) }
        : {}),
    });
    return {
      url: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.vaahansafe.com"}/shared/documents#${token}`,
      expiresAt: new Date(Date.now() + seconds * 1000).toISOString(),
    };
  }
  if (action === "detail" || action === "delete") return run(action, { id });
  if (action === "revoke")
    return run(action, { id, shareId: uuid(input.shareId) });
  throw new VaultError("INVALID_ACTION");
}
export async function listDocuments(
  params: URLSearchParams,
): Promise<VaultPage> {
  const auth = await customer();
  const owner = auth.user.id;
  const session = auth.session.id;
  const vehicle = params.get("vehicle") || "";
  const category = params.get("category") || "";
  const protection = params.get("protection") || "";
  const file = params.get("file") || "";
  const validity = params.get("validity") || "";
  const search = (params.get("search") || "").trim().slice(0, 100);
  const sort = params.get("sort") || "recent";
  const sortMap: Record<string, { expr: string; order: string }> = {
    recent: { expr: "d.created_at::text", order: "DESC" },
    updated: { expr: "d.updated_at::text", order: "DESC" },
    oldest: { expr: "d.created_at::text", order: "ASC" },
    name: { expr: "lower(d.title)", order: "ASC" },
    expiry: { expr: "coalesce(d.expires_at::text,'9999-12-31')", order: "ASC" },
  };
  if (!Object.hasOwn(sortMap, sort)) throw new VaultError("INVALID_INPUT");
  if (category && !Object.hasOwn(CATEGORIES, category))
    throw new VaultError("INVALID_INPUT");
  if (
    protection &&
    !["ACCOUNT", "VAULT_PIN", "DOCUMENT_PASSWORD"].includes(protection)
  )
    throw new VaultError("INVALID_INPUT");
  if (file && !["pdf", "image"].includes(file))
    throw new VaultError("INVALID_INPUT");
  const args: unknown[] = [owner];
  let where =
    "d.owner_user_id=? AND d.status='READY' AND d.deleted_at IS NULL AND (d.vehicle_id IS NULL OR (v.user_id=d.owner_user_id::text AND v.status<>'DELETED' AND v.deleted_at IS NULL))";
  if (vehicle) {
    where += " AND d.vehicle_id=?";
    args.push(vehicle);
    const owned = await db().queryFirst(
      "SELECT id FROM vehicles WHERE id=? AND user_id=? AND status<>'DELETED' AND deleted_at IS NULL",
      [vehicle, owner],
    );
    if (!owned) throw new VaultError("NOT_FOUND", 404);
  }
  if (category) {
    where += " AND d.category=?";
    args.push(category);
  }
  if (protection) {
    where += " AND d.security_mode=?";
    args.push(protection);
  }
  if (file)
    where +=
      file === "pdf"
        ? " AND r.mime_type='application/pdf'"
        : " AND r.mime_type LIKE 'image/%'";
  const today = "(now() AT TIME ZONE 'Asia/Kolkata')::date";
  const valid: Record<string, string> = {
    VALID: `d.expires_at>${today}+30`,
    EXPIRING_SOON: `d.expires_at BETWEEN ${today} AND ${today}+30`,
    EXPIRED: `d.expires_at<${today}`,
    NO_EXPIRY: "d.expires_at IS NULL",
  };
  if (validity) {
    if (!valid[validity]) throw new VaultError("INVALID_INPUT");
    where += ` AND ${valid[validity]}`;
  }
  if (search) {
    where +=
      " AND (d.title ILIKE ? ESCAPE '\\' OR replace(d.category,'_',' ') ILIKE ? ESCAPE '\\' OR d.issuer_name ILIKE ? ESCAPE '\\' OR v.registration_number ILIKE ? ESCAPE '\\')";
    const q = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
    args.push(q, q, q, q);
  }
  for (const [key, op] of [
    ["from", ">="],
    ["until", "<="],
  ] as const) {
    const value = params.get(key);
    if (value) {
      where += ` AND (d.created_at AT TIME ZONE 'Asia/Kolkata')::date ${op} ?::date`;
      args.push(date(value));
    }
  }
  const base = where;
  const baseArgs = [...args];
  const spec = sortMap[sort]!;
  if (params.get("cursor")) {
    try {
      const cursor = JSON.parse(
        Buffer.from(params.get("cursor")!, "base64url").toString(),
      ) as { value: string; id: string; sort: string };
      if (
        cursor.sort !== sort ||
        typeof cursor.value !== "string" ||
        cursor.value.length > 150
      )
        throw new Error();
      uuid(cursor.id);
      where += ` AND (${spec.expr},d.id) ${spec.order === "ASC" ? ">" : "<"} (?,?::uuid)`;
      args.push(cursor.value, cursor.id);
    } catch {
      throw new VaultError("INVALID_CURSOR");
    }
  }
  const [rows, vehicles, stats, settings, usage, policy] = await Promise.all([
    db().query<{
      document: VaultDocument;
      sort_value: string;
      has_thumbnail: boolean;
    }>(
      `SELECT public.vault_projection(d.id) AS document,${spec.expr} AS sort_value,r.thumbnail_key IS NOT NULL AS has_thumbnail FROM customer_documents d JOIN customer_document_versions r ON r.document_id=d.id AND r.version_number=d.current_version AND r.status='READY' LEFT JOIN vehicles v ON v.id=d.vehicle_id WHERE ${where} ORDER BY ${spec.expr} ${spec.order},d.id ${spec.order} LIMIT 25`,
      args,
    ),
    db().query<{ id: string; label: string }>(
      "SELECT id,left(registration_number,2)||'••••'||right(registration_number,4)||' · '||make||' '||model AS label FROM vehicles WHERE user_id=? AND status<>'DELETED' AND deleted_at IS NULL ORDER BY created_at DESC",
      [owner],
    ),
    db().query<{ category: string; count: number; expiring: number }>(
      `SELECT d.category,count(*)::integer AS count,count(*) FILTER(WHERE d.expires_at BETWEEN ${today} AND ${today}+30)::integer AS expiring FROM customer_documents d JOIN customer_document_versions r ON r.document_id=d.id AND r.version_number=d.current_version LEFT JOIN vehicles v ON v.id=d.vehicle_id WHERE ${base} GROUP BY d.category`,
      baseArgs,
    ),
    rpc<VaultPage["vault"]>("vault_session_state", [session]),
    db().queryFirst<{ bytes: number }>(
      "SELECT bytes FROM customer_vault_usage WHERE owner_user_id=?",
      [owner],
    ),
    db().queryFirst<{ max_bytes: number; max_documents: number }>(
      "SELECT max_bytes,max_documents FROM customer_vault_policy WHERE id=true",
    ),
  ]);
  if (!policy) throw new VaultError("SERVICE_UNAVAILABLE", 503);
  const selected = rows.slice(0, 24);
  const last = selected.at(-1);
  const tokens = selected
    .filter((r) => r.has_thumbnail)
    .map((r) => ({ id: r.document.id, token: newToken() }));
  // One batch authorization query. No per-card metadata or authorization queries.
  if (tokens.length) {
    const hashes = await rpc<string[]>("vault_thumbnail_grants", [
      session,
      JSON.stringify(
        tokens.map((t) => ({ id: t.id, hash: hashToken(t.token) })),
      ),
    ]);
    const allowed = new Set(hashes);
    for (const t of tokens) {
      if (allowed.has(hashToken(t.token)))
        selected.find((r) => r.document.id === t.id)!.document.thumbnail_token =
          t.token;
    }
  }
  return {
    documents: selected.map((r) => r.document),
    cursor:
      rows.length > 24 && last
        ? Buffer.from(
            JSON.stringify({
              value: last.sort_value,
              id: last.document.id,
              sort,
            }),
          ).toString("base64url")
        : null,
    vehicles,
    summary: {
      count: stats.reduce((a, r) => a + Number(r.count), 0),
      expiring: stats.reduce((a, r) => a + Number(r.expiring), 0),
      categories: Object.fromEntries(
        stats.map((r) => [r.category, Number(r.count)]),
      ),
    },
    usage: {
      bytes: Number(usage?.bytes || 0),
      maxBytes: Number(policy.max_bytes),
      maxDocuments: policy.max_documents,
    },
    vault: settings,
    workerUrl: workerUrl(),
  };
}
export async function shareCommand(input: Record<string, unknown>) {
  const token = String(input.token || "");
  if (!/^[A-Za-z0-9_-]{43}$/.test(token))
    throw new VaultError("SHARE_UNAVAILABLE", 404);
  const hash = hashToken(token);
  if (input.action === "info") return rpc("vault_share", [hash, "info", "{}"]);
  const secret = await rpc("vault_share", [hash, "secret", "{}"]);
  if (
    secret.verifier &&
    !(await matches(String(input.password), String(secret.verifier)))
  )
    throw new VaultError("INCORRECT_PASSWORD");
  const preview = newToken(),
    download = newToken();
  const result = await rpc("vault_share", [
    hash,
    "open",
    JSON.stringify({
      verifier: secret.verifier,
      previewHash: hashToken(preview),
      downloadHash: hashToken(download),
    }),
  ]);
  return {
    ...result,
    url: `${workerUrl()}/access/${preview}`,
    downloadUrl: result.download ? `${workerUrl()}/access/${download}` : null,
    expiresAt: new Date(Date.now() + 60000).toISOString(),
  };
}
