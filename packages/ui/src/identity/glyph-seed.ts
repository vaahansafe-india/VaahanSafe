import type { AvatarSeedData, ColorBlob } from "./glyph-types";

// Curated harmonious palettes inspired by VaahanSafe brand tokens (Coral, Terracotta, Emerald, Amber, Slate)
const BRAND_PALETTES: [string, string, string, string][] = [
  // 0: Sunset Coral (Signature VaahanSafe)
  ["#c95b3b", "#e87a5d", "#f4a261", "#261510"],
  // 1: Safety Emerald (Verified Telemetry)
  ["#2a7b6e", "#5db8a6", "#3ecf8e", "#13312c"],
  // 2: Radiant Amber (Golden Automotive Pulse)
  ["#d97706", "#f59e0b", "#cc785c", "#1c1409"],
  // 3: Obsidian Core (Deep Tactical Safety)
  ["#181816", "#cc785c", "#5db8a6", "#2f2d29"],
  // 4: Terracotta Dawn (Warm Earth & Safety)
  ["#b84a2c", "#e5a83b", "#cc785c", "#40180d"],
  // 5: Cyber Teal & Coral (Modern Tech High-Contrast)
  ["#1f4037", "#5db8a6", "#e06847", "#0d1b17"],
  // 6: Crimson & Gold (Alert Beacon)
  ["#991b1b", "#ea580c", "#facc15", "#280707"],
  // 7: Titanium Slate (Precision Engineering)
  ["#334155", "#64748b", "#cc785c", "#0f172a"],
];

function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
}

export function createAvatarSeed(rawIdentifier: string, name?: string, isVerified = false): AvatarSeedData {
  const normalized = (rawIdentifier || name || "vaahansafe").trim().toLowerCase();
  const hash = fnv1a(normalized);

  const hexPart = (hash & 0xffff).toString(16).toUpperCase().padStart(4, "0");
  const fingerprint = `VS-${hexPart}`;

  // Select palette
  const paletteIndex = hash % BRAND_PALETTES.length;
  const palette = BRAND_PALETTES[paletteIndex] ?? BRAND_PALETTES[0]!;

  // Generate 3 deterministic swirling radial blobs (positions 0-40, radius 14-28)
  const b1x = 8 + ((hash >>> 3) % 24);
  const b1y = 6 + ((hash >>> 6) % 24);
  const b1r = 16 + ((hash >>> 9) % 12);

  const b2x = 16 + ((hash >>> 12) % 20);
  const b2y = 16 + ((hash >>> 15) % 20);
  const b2r = 14 + ((hash >>> 18) % 14);

  const b3x = 6 + ((hash >>> 21) % 26);
  const b3y = 18 + ((hash >>> 24) % 18);
  const b3r = 12 + ((hash >>> 27) % 12);

  const blobs: ColorBlob[] = [
    { cx: b1x, cy: b1y, r: b1r, color: palette[1] },
    { cx: b2x, cy: b2y, r: b2r, color: palette[2] },
    { cx: b3x, cy: b3y, r: b3r, color: palette[3] },
  ];

  // Extract initials
  const cleanName = (name || rawIdentifier || "V").trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);
  let initials = "V";
  if (parts.length >= 2) {
    initials = (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  } else if (parts[0]) {
    // If it's an email like "vaahansafe@gmail.com", take "VS" or first 2 chars
    const base = parts[0].replace(/[@._-].*$/, "");
    if (base.length >= 2) {
      initials = base.slice(0, 2).toUpperCase();
    } else {
      initials = base.charAt(0).toUpperCase();
    }
  }

  return {
    hash,
    fingerprint,
    initials: initials.slice(0, 2),
    palette,
    blobs,
    isVerified,
  };
}
