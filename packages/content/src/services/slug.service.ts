/**
 * Authoritative Slug Normalization & Validation Service
 *
 * Ensures SEO-friendly, clean, lowercased, safe URL slugs.
 */

export function normalizeSlug(raw: string): string {
  if (!raw) return "";
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric except hyphen and space
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Collapse consecutive hyphens
    .replace(/^-+|-+$/g, ""); // Strip leading and trailing hyphens
}

export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== "string") return false;
  // Slug must be 3-120 chars, lowercase alphanumeric and hyphens, no double hyphens
  const regex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slug.length >= 3 && slug.length <= 120 && regex.test(slug);
}
