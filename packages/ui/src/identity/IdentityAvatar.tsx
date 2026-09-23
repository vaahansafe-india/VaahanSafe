"use client";

import * as React from "react";
import { IdentityGlyph } from "./IdentityGlyph";
import type { IdentityAvatarProps } from "./glyph-types";

export function IdentityAvatar({
  seed,
  name,
  src,
  size = "md",
  isVerified = false,
  className = "",
  showFingerprint = false,
}: IdentityAvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  // If a real profile photo exists and loads cleanly, render it
  if (src && !imageError) {
    const sizeClasses = {
      xs: "size-6",
      sm: "size-8",
      md: "size-10",
      lg: "size-14",
      profile: "size-24",
    };

    return (
      <div
        className={`relative shrink-0 rounded-lg overflow-hidden border ${
          isVerified ? "border-[#5db8a6]/40" : "border-[#cc785c]/30"
        } ${sizeClasses[size] || "size-10"} ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name || "User avatar"}
          className="size-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Fallback: Deterministic VaahanSafe Identity Glyph
  return (
    <IdentityGlyph
      seed={seed}
      name={name}
      size={size}
      isVerified={isVerified}
      className={className}
      showFingerprint={showFingerprint}
    />
  );
}
