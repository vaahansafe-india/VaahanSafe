import type { QrDigitalPassData } from "@/lib/qr-types";

/* -------------------------------------------------------------------------- */
/*                              DATA VALIDATION                               */
/* -------------------------------------------------------------------------- */

const ALLOWED_RESOLVER_HOSTS = new Set([
  "qr.vaahansafe.com",
  "localhost",
  "127.0.0.1",
]);

export function validatePlacardData(data: QrDigitalPassData): void {
  if (!data) {
    throw new Error("PLACARD_DATA_REQUIRED");
  }

  if (!data.resolverUrl) {
    throw new Error("RESOLVER_URL_REQUIRED");
  }

  let resolver: URL;
  try {
    resolver = new URL(data.resolverUrl);
  } catch {
    throw new Error("INVALID_RESOLVER_URL");
  }

  /*
   * Do not allow arbitrary external URLs to be embedded in a trusted
   * VaahanSafe PDF. Must be on qr.vaahansafe.com, *.vaahansafe.com, or local dev.
   */
  const isTrustedHost =
    ALLOWED_RESOLVER_HOSTS.has(resolver.hostname) ||
    resolver.hostname.endsWith(".vaahansafe.com");

  const isTrustedProtocol =
    resolver.protocol === "https:" ||
    (resolver.protocol === "http:" &&
      (resolver.hostname === "localhost" || resolver.hostname === "127.0.0.1"));

  if (!isTrustedProtocol || !isTrustedHost) {
    throw new Error("UNTRUSTED_RESOLVER_URL");
  }

  if (!data.publicId) {
    throw new Error("PUBLIC_ID_REQUIRED");
  }

  if (!data.vehicle) {
    throw new Error("VEHICLE_REQUIRED");
  }
}
