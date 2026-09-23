import type { GlyphSeed, IdentityAvatarSize } from "./glyph-types";

export interface GlyphPathSpec {
  mainPaths: string[];
  constructionPaths: string[];
  nodes: { cx: number; cy: number; isAccent?: boolean }[];
}

/**
 * Resolves 8 distinct VaahanSafe safety topology families based on a 32x32 drafting grid.
 * Inspired by automotive telemetry, cryptographic QR circuits, and safety badges.
 */
export function resolveGlyphGeometry(seed: GlyphSeed, size: IdentityAvatarSize): GlyphPathSpec {
  const isMicro = size === "xs";
  const isDetailed = size === "lg" || size === "profile";

  const families: (() => GlyphPathSpec)[] = [
    // 0: Shield Anchor — Protective safety seal & vertical lifeline rail
    () => ({
      mainPaths: [
        "M 8,24 L 8,14 L 16,8 L 24,14 L 24,24",
        seed.hasAuxRail ? "M 16,8 L 16,24" : "",
      ].filter(Boolean),
      constructionPaths: isDetailed ? ["M 8,24 L 24,24", "M 4,16 L 28,16"] : [],
      nodes: [
        { cx: 16, cy: 8, isAccent: true },
        { cx: 8, cy: 24 },
        { cx: 24, cy: 24 },
      ],
    }),

    // 1: Hexagon Node — VaahanSafe brand mark geometric facet
    () => ({
      mainPaths: [
        "M 16,6 L 25,11 L 25,21 L 16,26 L 7,21 L 7,11 Z",
        seed.hasAuxRail ? "M 16,6 L 16,26" : "M 7,16 L 25,16",
      ].filter(Boolean),
      constructionPaths: isDetailed ? ["M 16,2 L 16,30", "M 2,16 L 30,16"] : [],
      nodes: [
        { cx: 16, cy: 6, isAccent: true },
        { cx: 16, cy: 26 },
      ],
    }),

    // 2: Telemetry Rail — Stepped automotive bus relay
    () => ({
      mainPaths: [
        "M 7,25 L 7,17 L 16,17 L 16,7 L 25,7",
        seed.hasAuxRail ? "M 16,25 L 25,25 L 25,17" : "",
      ].filter(Boolean),
      constructionPaths: isDetailed ? ["M 4,17 L 28,17", "M 16,4 L 16,28"] : [],
      nodes: [
        { cx: 25, cy: 7, isAccent: true },
        { cx: 7, cy: 25 },
        ...(seed.hasAuxRail ? [{ cx: 25, cy: 25 }] : []),
      ],
    }),

    // 3: Beacon Fork — Incident broadcast & emergency contact relay
    () => ({
      mainPaths: [
        "M 16,26 L 16,16 L 8,10",
        "M 16,16 L 24,10",
        seed.hasAuxRail ? "M 8,18 L 16,18 L 24,18" : "",
      ].filter(Boolean),
      constructionPaths: isDetailed ? ["M 8,10 L 24,10"] : [],
      nodes: [
        { cx: 24, cy: 10, isAccent: seed.nodePosition % 2 === 0 },
        { cx: 8, cy: 10, isAccent: seed.nodePosition % 2 !== 0 },
        { cx: 16, cy: 26 },
      ],
    }),

    // 4: Cryptographic Loop — QR identity binding circuit
    () => ({
      mainPaths: [
        "M 8,8 L 24,8 L 24,24 L 14,24 L 14,15 L 19,15",
      ],
      constructionPaths: isDetailed ? ["M 8,15 L 24,15"] : [],
      nodes: [
        { cx: 19, cy: 15, isAccent: true },
        { cx: 8, cy: 8 },
        { cx: 24, cy: 24 },
      ],
    }),

    // 5: Relay Crosscut — Passerby direct-dial encrypted bridge
    () => ({
      mainPaths: [
        "M 6,12 L 18,12 L 18,25 L 26,25",
        "M 12,6 L 12,18",
      ],
      constructionPaths: isDetailed ? ["M 18,6 L 18,26", "M 6,25 L 26,25"] : [],
      nodes: [
        { cx: 26, cy: 25, isAccent: true },
        { cx: 6, cy: 12 },
        { cx: 12, cy: 6 },
      ],
    }),

    // 6: Cantilever Bracket — Vehicle chassis structural anchor
    () => ({
      mainPaths: [
        "M 7,9 L 25,9",
        "M 11,16 L 25,16",
        "M 15,23 L 25,23",
        seed.hasAuxRail ? "M 25,9 L 25,23" : "",
      ].filter(Boolean),
      constructionPaths: isDetailed ? ["M 7,9 L 7,23"] : [],
      nodes: [
        { cx: 25, cy: 9, isAccent: true },
        { cx: 25, cy: 16 },
        { cx: 25, cy: 23 },
      ],
    }),

    // 7: Safety Pulse — Live telemetry heartbeat curve
    () => ({
      mainPaths: [
        "M 5,18 L 11,18 L 15,7 L 19,25 L 23,18 L 27,18",
      ],
      constructionPaths: isDetailed ? ["M 5,18 L 27,18"] : [],
      nodes: [
        { cx: 15, cy: 7, isAccent: true },
        { cx: 19, cy: 25 },
      ],
    }),
  ];

  const resolver = families[seed.family] ?? families[0]!;
  const base = resolver();

  // For micro size (24px), omit secondary nodes to preserve clean rendering
  if (isMicro) {
    base.nodes = base.nodes.filter((n) => n.isAccent);
    base.constructionPaths = [];
  }

  return base;
}
