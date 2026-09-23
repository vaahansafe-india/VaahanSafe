"use client";

import * as React from "react";
import { createAvatarSeed } from "./glyph-seed";
import { resolveGlyphGeometry } from "./glyph-geometry";
import type { IdentityGlyphProps } from "./glyph-types";

export function IdentityGlyph({
  seed,
  name,
  size = "md",
  isVerified = false,
  className = "",
  showFingerprint = false,
  ...props
}: IdentityGlyphProps) {
  const glyphSeed = React.useMemo(
    () => createAvatarSeed(seed || name || "vaahansafe-owner", isVerified),
    [seed, name, isVerified]
  );

  const geometry = React.useMemo(
    () => resolveGlyphGeometry(glyphSeed, size),
    [glyphSeed, size]
  );

  const pixelSizes = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    profile: 96,
  };
  const px = pixelSizes[size] || 40;

  // Transform matrix based on rotation & mirror
  const transform = [
    `rotate(${glyphSeed.rotation} 16 16)`,
    glyphSeed.mirrorX ? "scale(-1, 1) translate(-32, 0)" : "",
    glyphSeed.mirrorY ? "scale(1, -1) translate(0, -32)" : "",
  ].filter(Boolean).join(" ");

  // Accent color: verified emerald (#5db8a6) if verified, else brand coral (#cc785c)
  const accentColor = isVerified ? "#5db8a6" : "#cc785c";
  const accentGlow = isVerified ? "rgba(93, 184, 166, 0.25)" : "rgba(204, 120, 92, 0.25)";

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-lg overflow-hidden border transition-all ${className}`}
      style={{
        width: px,
        height: px,
        backgroundColor: "var(--vaahan-glyph-bg, rgba(204, 120, 92, 0.08))",
        borderColor: isVerified ? "rgba(93, 184, 166, 0.3)" : "rgba(204, 120, 92, 0.3)",
      }}
      title={name ? `${name} [${glyphSeed.fingerprint}]` : `Identity ${glyphSeed.fingerprint}`}
      aria-label={name ? `${name} identity glyph` : "VaahanSafe Identity Glyph"}
    >
      <svg
        viewBox="0 0 32 32"
        width={px}
        height={px}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-full select-none"
        {...props}
      >
        {/* Subtle Drafting Grid on Detailed & Profile Sizes */}
        {(size === "lg" || size === "profile") && (
          <g opacity="0.15" stroke="currentColor">
            <line x1="8" y1="4" x2="8" y2="28" strokeWidth="0.5" strokeDasharray="1 3" />
            <line x1="16" y1="4" x2="16" y2="28" strokeWidth="0.5" strokeDasharray="1 3" />
            <line x1="24" y1="4" x2="24" y2="28" strokeWidth="0.5" strokeDasharray="1 3" />
            <line x1="4" y1="8" x2="28" y2="8" strokeWidth="0.5" strokeDasharray="1 3" />
            <line x1="4" y1="16" x2="28" y2="16" strokeWidth="0.5" strokeDasharray="1 3" />
            <line x1="4" y1="24" x2="28" y2="24" strokeWidth="0.5" strokeDasharray="1 3" />
          </g>
        )}

        <g transform={transform}>
          {/* Construction Guide Paths */}
          {geometry.constructionPaths.map((d, i) => (
            <path
              key={`const-${i}`}
              d={d}
              stroke="currentColor"
              strokeWidth="0.75"
              strokeDasharray="2 2"
              className="text-muted-foreground/35"
            />
          ))}

          {/* Primary Signal Paths */}
          {geometry.mainPaths.map((d, i) => (
            <path
              key={`main-${i}`}
              d={d}
              stroke="currentColor"
              strokeWidth={size === "xs" ? 2.2 : 2.0}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-foreground"
            />
          ))}

          {/* Telemetry Nodes & Verification Points */}
          {geometry.nodes.map((node, i) => (
            <circle
              key={`node-${i}`}
              cx={node.cx}
              cy={node.cy}
              r={node.isAccent ? (size === "xs" ? 2.0 : 2.5) : 1.5}
              fill={node.isAccent ? accentColor : "currentColor"}
              stroke={node.isAccent ? accentGlow : "none"}
              strokeWidth={node.isAccent ? 3 : 0}
              className={node.isAccent ? "" : "text-muted-foreground"}
            />
          ))}
        </g>
      </svg>

      {/* Profile Size Technical Fingerprint Badge */}
      {showFingerprint && size === "profile" && (
        <span
          className="absolute bottom-1 right-1.5 font-mono text-[8px] font-bold tracking-widest px-1 py-0.2 rounded border bg-background/90"
          style={{
            color: accentColor,
            borderColor: isVerified ? "rgba(93, 184, 166, 0.3)" : "rgba(204, 120, 92, 0.3)",
          }}
        >
          {glyphSeed.fingerprint}
        </span>
      )}
    </div>
  );
}
