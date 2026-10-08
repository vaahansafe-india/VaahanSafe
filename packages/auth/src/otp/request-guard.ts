/** Server-owned OTP request truth. MSG91 generates and verifies the code. */
export interface OtpRequestStore {
  reserve(input: { id: string; tokenHash: string; phoneHash: string; ipHash: string; surface: OtpSurface; channel: "SMS" | "WHATSAPP" }): Promise<boolean>;
  finishDispatch(id: string, success: boolean, requestId?: string): Promise<boolean>;
  claimVerification(input: { tokenHash: string; phoneHash: string; surface: OtpSurface }): Promise<{ id: string; channel: "SMS" | "WHATSAPP"; provider_request_id: string | null } | null>;
  finishVerification(id: string, success: boolean): Promise<boolean>;
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
    private store: OtpRequestStore,
    private surface: OtpSurface,
  ) {}

  async reserve(
    phone: string,
    request: Request,
    channel: "SMS" | "WHATSAPP" = "SMS",
  ) {
    const token = `${crypto.randomUUID()}${crypto.randomUUID()}`;
    const [phoneHash, ipHash, tokenHash] = await Promise.all([
      digest(`phone:${phone}`),
      // Vercel overwrites x-vercel-forwarded-for; generic client-forwarded headers are ignored.
      digest(`ip:${process.env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "unavailable" : request.headers.get("cf-connecting-ip") || "unavailable"}`),
      digest(`token:${token}`),
    ]);
    const id = `otp_${crypto.randomUUID()}`;
    const reserved = await this.store.reserve({ id, tokenHash, phoneHash, ipHash, surface: this.surface, channel });
    if (!reserved)
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
    const saved = await this.store.finishDispatch(id, result.success, result.requestId);
    if (!saved)
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
    const row = await this.store.claimVerification({ tokenHash, phoneHash, surface: this.surface });
    if (!row) return { success: false };
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
      const saved = await this.store.finishVerification(row.id, success);
      if (!saved)
        throw new Error("OTP verification recording unavailable");
    }
  }
}
