import {
  createHmac,
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

type Ticket = {
  eventId: string;
  qrId: string;
  publicId: string;
  expires: number;
};
function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("Scan protection unavailable");
  return createHmac("sha256", secret)
    .update("vaahansafe:scan-location:v1")
    .digest();
}
export function createScanLocationTicket(
  eventId: string,
  qrId: string,
  publicId: string,
  now = Date.now(),
) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const payload = Buffer.from(
    JSON.stringify({ eventId, qrId, publicId, expires: now + 900000 }),
  );
  const ciphertext = Buffer.concat([cipher.update(payload), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString(
    "base64url",
  );
}
export function readScanLocationTicket(
  value: unknown,
  now = Date.now(),
): Ticket | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
    const bytes = Buffer.from(value, "base64url");
    if (bytes.length < 29) return null;
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key(),
      bytes.subarray(0, 12),
    );
    decipher.setAuthTag(bytes.subarray(12, 28));
    const data = JSON.parse(
      Buffer.concat([
        decipher.update(bytes.subarray(28)),
        decipher.final(),
      ]).toString(),
    ) as Ticket;
    if (
      typeof data.eventId !== "string" ||
      typeof data.qrId !== "string" ||
      typeof data.publicId !== "string" ||
      !Number.isFinite(data.expires) ||
      data.expires <= now ||
      data.expires > now + 900000
    )
      return null;
    return data;
  } catch {
    return null;
  }
}
