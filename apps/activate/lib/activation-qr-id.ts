/** Preserve opaque public-ID case. Legacy vs_ identifiers retain their existing format. */
export function normalizePublicId(input: string): string {
  if (!input || typeof input !== "string") return "";
  let cleaned = input.trim();
  if (cleaned.includes("/")) {
    try {
      const url = new URL(
        cleaned.startsWith("http") ? cleaned : `https://${cleaned}`,
      );
      cleaned = url.pathname.split("/").filter(Boolean).at(-1) || "";
    } catch {
      cleaned = cleaned.split("/").filter(Boolean).at(-1) || "";
    }
  }
  cleaned = (cleaned.split("?")[0] || "").split("#")[0]!.trim();
  if (/^VS[-_]/i.test(cleaned)) return `vs_${cleaned.slice(3).toLowerCase()}`;
  return cleaned;
}
export function activationQrLookup(input: string) {
  const publicId = normalizePublicId(input);
  return {
    publicId,
    visibleCode: `VS-${publicId.replace(/^vs_/, "").toUpperCase()}`,
  };
}
