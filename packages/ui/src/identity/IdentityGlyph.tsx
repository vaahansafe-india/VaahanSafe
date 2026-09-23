"use client";

import * as React from "react";
import { createAvatarSeed } from "./glyph-seed";
import type { IdentityAvatarProps, IdentityAvatarSize } from "./glyph-types";

const SIZE_CONFIGS: Record<IdentityAvatarSize, { px: number; radius: string; fontSize: number; dotSize: number; blurRadius: number }> = {
  xs: { px: 24, radius: "rounded-md", fontSize: 10, dotSize: 5, blurRadius: 4 },
  sm: { px: 32, radius: "rounded-lg", fontSize: 13, dotSize: 6.5, blurRadius: 6 },
  md: { px: 40, radius: "rounded-xl", fontSize: 15, dotSize: 8, blurRadius: 7 },
  lg: { px: 56, radius: "rounded-2xl", fontSize: 20, dotSize: 10, blurRadius: 9 },
  profile: { px: 96, radius: "rounded-3xl", fontSize: 32, dotSize: 14, blurRadius: 12 },
};

export function IdentityGlyph({
  seed,
  name,
  size = "md",
  variant = "aura",
  isVerified = false,
  className = "",
  showFingerprint = false,
  ...props
}: IdentityAvatarProps) {
  const seedData = React.useMemo(
    () => createAvatarSeed(seed, name, isVerified),
    [seed, name, isVerified]
  );

  const config = SIZE_CONFIGS[size] ?? SIZE_CONFIGS.md;
  const filterId = React.useId().replace(/:/g, "_");

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${config.radius} overflow-hidden shadow-xs border border-white/10 select-none ${className}`}
      style={{
        width: config.px,
        height: config.px,
      }}
      title={name ? `${name} [${seedData.fingerprint}]` : `VaahanSafe [${seedData.fingerprint}]`}
      aria-label={name ? `${name} avatar` : "VaahanSafe avatar"}
      {...props}
    >
      <svg
        viewBox="0 0 40 40"
        width={config.px}
        height={config.px}
        className="size-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id={`blur-${filterId}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={config.blurRadius} />
          </filter>
          <clipPath id={`clip-${filterId}`}>
            <rect width="40" height="40" rx="9" />
          </clipPath>
        </defs>

        <g clipPath={`url(#clip-${filterId})`}>
          {/* Base gradient foundation */}
          <rect width="40" height="40" fill={seedData.palette[0]} />

          {/* Overlapping organic gradient blobs with Gaussian blur */}
          <g filter={`url(#blur-${filterId})`}>
            {seedData.blobs.map((blob, idx) => (
              <circle
                key={idx}
                cx={blob.cx}
                cy={blob.cy}
                r={blob.r}
                fill={blob.color}
                opacity={0.88}
              />
            ))}
          </g>

          {/* Subtle noise/vignette overlay for rich texture */}
          <rect
            width="40"
            height="40"
            fill="none"
            stroke="rgba(255, 255, 255, 0.22)"
            strokeWidth="1.2"
            rx="9"
          />
        </g>

        {/* Center content based on variant */}
        {variant === "aura" && (
          <text
            x="50%"
            y="54%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#ffffff"
            fontSize={config.fontSize}
            fontWeight="700"
            fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            style={{
              letterSpacing: seedData.initials.length > 1 ? "-0.05em" : "0",
              filter: "drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.45))",
            }}
          >
            {seedData.initials}
          </text>
        )}

        {variant === "shield" && (
          <g transform="translate(11, 10) scale(0.75)" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.5))" }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </g>
        )}
      </svg>

      {/* Verified Status Dot Badge */}
      {isVerified && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-background bg-[#5db8a6] shadow-xs"
          style={{
            width: config.dotSize,
            height: config.dotSize,
          }}
          title="Verified Account"
        />
      )}

      {/* Technical Fingerprint on Profile size */}
      {showFingerprint && size === "profile" && (
        <span className="absolute bottom-1.5 font-mono text-[9px] font-bold tracking-widest text-white/90 bg-black/60 px-1.5 py-0.5 rounded-md border border-white/20 backdrop-blur-xs">
          {seedData.fingerprint}
        </span>
      )}
    </div>
  );
}
