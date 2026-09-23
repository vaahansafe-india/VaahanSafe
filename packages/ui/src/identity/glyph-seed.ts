import type { GlyphSeed } from "./glyph-types";

/**
 * 32-bit FNV-1a deterministic hash.
 * Produces identical numerical seeds across browser engines and SSR runtimes.
 */
function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
}

/**
 * Creates a deterministic seed from stable user UUID, phone, email, or normalized name.
 */
export function createAvatarSeed(rawIdentifier: string, isVerified = false): GlyphSeed {
  const normalized = (rawIdentifier || "vaahansafe-owner").trim().toLowerCase();
  const hash = fnv1a(normalized);

  // 4-character technical display fingerprint (e.g. "VS-7C21")
  const hexPart = (hash & 0xffff).toString(16).toUpperCase().padStart(4, "0");
  const fingerprint = `VS-${hexPart}`;

  const family = hash % 8;
  const rotationIndex = (hash >>> 4) % 4;
  const rotations: (0 | 90 | 180 | 270)[] = [0, 90, 180, 270];

  const mirrorX = Boolean((hash >>> 6) & 1);
  const mirrorY = Boolean((hash >>> 7) & 1);
  const segmentMask = (hash >>> 8) & 0x1f; // 5-bit mask
  const nodePosition = (hash >>> 13) % 4;
  const hasAuxRail = Boolean((hash >>> 15) & 1);

  return {
    hash,
    fingerprint,
    family,
    rotation: rotations[rotationIndex] ?? 0,
    mirrorX,
    mirrorY,
    segmentMask,
    nodePosition,
    hasAuxRail,
    isVerified,
  };
}
