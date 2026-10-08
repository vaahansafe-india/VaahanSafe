/** D1-owned OTP request truth. MSG91 generates and verifies the code. */
interface OtpDatabase {
  queryFirst<T>(sql: string, params?: unknown[]): Promise<T | null>;
  execute(
    sql: string,
    params?: unknown[],
  ): Promise<{ success: boolean; rowsAffected?: number }>;
}
export type OtpSurface = "CUSTOMER" | "ACTIVATE" | "API" | "ADMIN";
export interface OtpProviderChallenge {
  channel: "SMS" | "WHATSAPP";
  requestId?: string;
}
export class OtpRequestError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function digest(value: string) {
  const secret =
    process.env.OTP_REQUEST_HASH_SECRET || process.env.SESSION_SECRET;
  if (!secret || secret.length < 16)
    throw new Error("OTP security configuration unavailable");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(signed), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

export function otpCookieName(surface: OtpSurface) {
  return `vs_${surface.toLowerCase()}_otp`;
}
export function serializeOtpCookie(
  surface: OtpSurface,
  token: string,
  request: Request,
) {
  const secure =
    process.env.NODE_ENV === "production" ||
    new URL(request.url).protocol === "https:";
  return `${otpCookieName(surface)}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=300${secure ? "; Secure" : ""}`;
}
function readOtpCookie(surface: OtpSurface, request: Request) {
  const prefix = `${otpCookieName(surface)}=`;
  return (request.headers.get("cookie") || "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(prefix))
    ?.slice(prefix.length);
}

export class OtpRequestGuard {
  constructor(
    private db: OtpDatabase,
    private surface: OtpSurface,
  ) {}

  async reserve(
    phone: string,
    request: Request,
    channel: "SMS" | "WHATSAPP" = "SMS",
  ) {
    const now = Date.now();
    const token = `${crypto.randomUUID()}${crypto.randomUUID()}`;
    const [phoneHash, ipHash, tokenHash] = await Promise.all([
      digest(`phone:${phone}`),
      // The trusted Cloudflare header is deliberately preferred over forwarded headers.
      digest(`ip:${request.headers.get("cf-connecting-ip") || "unavailable"}`),
      digest(`token:${token}`),
    ]);
    const id = `otp_${crypto.randomUUID()}`;
    // A single D1 conditional write serializes concurrent send attempts across every surface.
    const result = await this.db.execute(
      `INSERT INTO auth_otp_requests
      (id,token_hash,phone_hash,ip_hash,surface,channel,status,created_at,expires_at)
      SELECT ?,?,?,?,?,?,'RESERVED',?,?
      WHERE NOT EXISTS (SELECT 1 FROM auth_otp_requests WHERE phone_hash = ? AND created_at > ?)
      AND (SELECT COUNT(*) FROM auth_otp_requests WHERE phone_hash = ? AND created_at > ?) < 5
      AND (SELECT COUNT(*) FROM auth_otp_requests WHERE ip_hash = ? AND created_at > ?) < 20`,
      [
        id,
        tokenHash,
        phoneHash,
        ipHash,
        this.surface,
        channel,
        now,
        now + 300000,
        phoneHash,
        now - 60000,
        phoneHash,
        now - 900000,
        ipHash,
        now - 900000,
      ],
    );
    if (!result.success) throw new Error("OTP reservation unavailable");
    if (result.rowsAffected !== 1)
      throw new OtpRequestError(
        429,
        "OTP_RATE_LIMITED",
        "Please wait a minute before requesting another code.",
      );
    return { id, token };
  }

  async finishDispatch(
    id: string,
    result: { success: boolean; requestId?: string },
  ) {
    const update = await this.db.execute(
      "UPDATE auth_otp_requests SET status = ?, provider_request_id = ? WHERE id = ? AND status = 'RESERVED'",
      [
        result.success ? "SENT" : "FAILED",
        result.success ? result.requestId || null : null,
        id,
      ],
    );
    if (!update.success || update.rowsAffected !== 1)
      throw new Error("OTP dispatch recording unavailable");
  }

  async verify(
    phone: string,
    request: Request,
    providerVerify: (
      challenge: OtpProviderChallenge,
    ) => Promise<{ success: boolean }>,
  ) {
    const token = readOtpCookie(this.surface, request);
    if (!token || !/^[a-f0-9-]{72}$/.test(token)) return { success: false };
    const [tokenHash, phoneHash] = await Promise.all([
      digest(`token:${token}`),
      digest(`phone:${phone}`),
    ]);
    const row = await this.db.queryFirst<{
      id: string;
      channel: "SMS" | "WHATSAPP";
      provider_request_id: string | null;
    }>(
      `SELECT id, channel, provider_request_id FROM auth_otp_requests
      WHERE token_hash = ? AND phone_hash = ? AND surface = ? AND status = 'SENT'
      AND expires_at > ? AND attempt_count < 5`,
      [tokenHash, phoneHash, this.surface, Date.now()],
    );
    if (!row) return { success: false };
    const claimed = await this.db.execute(
      `UPDATE auth_otp_requests SET status = 'VERIFYING', attempt_count = attempt_count + 1
      WHERE id = ? AND status = 'SENT' AND attempt_count < 5 AND expires_at > ?`,
      [row.id, Date.now()],
    );
    if (!claimed.success || claimed.rowsAffected !== 1)
      return { success: false };
    let success = false;
    try {
      if (row.channel !== "SMS" && row.channel !== "WHATSAPP")
        return { success: false };
      if (row.channel === "WHATSAPP" && !row.provider_request_id)
        return { success: false };
      success = (
        await providerVerify({
          channel: row.channel,
          requestId: row.provider_request_id || undefined,
        })
      ).success;
      return { success };
    } finally {
      const saved = await this.db.execute(
        "UPDATE auth_otp_requests SET status = ?, verified_at = ? WHERE id = ? AND status = 'VERIFYING'",
        [success ? "VERIFIED" : "SENT", success ? Date.now() : null, row.id],
      );
      if (!saved.success || saved.rowsAffected !== 1)
        throw new Error("OTP verification recording unavailable");
    }
  }
}
