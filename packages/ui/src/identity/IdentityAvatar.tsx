"use client";

import * as React from "react";
import { IdentityGlyph } from "./IdentityGlyph";
import type { IdentityAvatarProps } from "./glyph-types";

const SIZE_CLASSES = {
  xs: "size-6 rounded-md",
  sm: "size-8 rounded-lg",
  md: "size-10 rounded-xl",
  lg: "size-14 rounded-2xl",
  profile: "size-24 rounded-3xl",
};

export function IdentityAvatar({
  seed,
  name,
  src,
  size = "md",
  variant = "aura",
  isVerified = false,
  className = "",
  showFingerprint = false,
  ...props
}: IdentityAvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  // If a real profile photo exists and loads cleanly, render it
  if (src && !imageError) {
    const sizeCls = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;

    return (
      <div
        className={`relative shrink-0 overflow-hidden border ${
          isVerified ? "border-[#5db8a6]/40" : "border-border"
        } ${sizeCls} ${className}`}
        {...props}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name || "User avatar"}
          className="size-full object-cover"
          onError={() => setImageError(true)}
        />
        {isVerified && (
          <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background bg-[#5db8a6]" />
        )}
      </div>
    );
  }

  // Fallback: Deterministic VaahanSafe Gradient Aura
  return (
    <IdentityGlyph
      seed={seed}
      name={name}
      size={size}
      variant={variant}
      isVerified={isVerified}
      className={className}
      showFingerprint={showFingerprint}
      {...props}
    />
  );
}
