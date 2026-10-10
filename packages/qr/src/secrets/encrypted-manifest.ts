// Server/manufacturing use only. This envelope never contains a plaintext code.
const encoder = new TextEncoder();
const purpose = "vaahansafe:offline-activation-packaging:v1";
const hex = (data: Uint8Array) =>
  Array.from(data, (b) => b.toString(16).padStart(2, "0")).join("");
function bytes(value: string) {
  if (!/^(?:[a-f0-9]{2})+$/.test(value))
    throw new Error("Invalid export encryption material");
  return Uint8Array.from(value.match(/../g)!, (b) => parseInt(b, 16));
}
async function deriveKey(keyHex: string, salt: Uint8Array) {
  if (!/^[a-f0-9]{64}$/.test(keyHex))
    throw new Error("Activation export encryption is not configured");
  const key = await crypto.subtle.importKey(
    "raw",
    bytes(keyHex) as any,
    "HKDF",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: salt as any,
      info: encoder.encode(purpose) as any,
    },
    key,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
export async function encryptActivationManifest(
  plaintext: string,
  keyHex: string,
  batchId: string,
) {
  const salt = crypto.getRandomValues(new Uint8Array(16)),
    iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(keyHex, salt);
  const data = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as any,
      additionalData: encoder.encode(`${purpose}:${batchId}`) as any,
    },
    key,
    encoder.encode(plaintext) as any,
  );
  return JSON.stringify({
    version: "v1",
    algorithm: "AES-256-GCM-HKDF-SHA256",
    salt: hex(salt),
    iv: hex(iv),
    ciphertext: btoa(
      Array.from(new Uint8Array(data), (b) => String.fromCharCode(b)).join(""),
    ),
  });
}
export async function decryptActivationManifest(
  encrypted: string,
  keyHex: string,
  batchId: string,
) {
  const envelope = JSON.parse(encrypted);
  if (
    envelope.version !== "v1" ||
    envelope.algorithm !== "AES-256-GCM-HKDF-SHA256"
  )
    throw new Error("Unsupported packaging archive");
  const salt = bytes(envelope.salt),
    iv = bytes(envelope.iv);
  if (salt.length !== 16 || iv.length !== 12)
    throw new Error("Invalid packaging archive");
  const key = await deriveKey(keyHex, salt);
  const data = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv as any,
      additionalData: encoder.encode(`${purpose}:${batchId}`) as any,
    },
    key,
    Uint8Array.from(atob(envelope.ciphertext), (c) =>
      c.charCodeAt(0),
    ) as any,
  );
  return new TextDecoder().decode(data);
}
