"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@vaahansafe/ui/lib/utils";
import type { ProductMediaItem } from "@/lib/orders-types";
import { ProductMediaFallback } from "./ProductMediaFallback";

interface ProductMediaProps {
  media?: ProductMediaItem | null;
  variant?: "hero" | "thumbnail" | "detail";
  alt?: string;
  className?: string;
  priority?: boolean;
}

export function ProductMedia({
  media,
  variant = "thumbnail",
  alt,
  className,
  priority = false,
}: ProductMediaProps) {
  const [hasError, setHasError] = useState(false);

  const src =
    variant === "hero"
      ? media?.heroUrl || "/images/products/vaahansafe-qr-kit-hero.jpg"
      : variant === "detail"
      ? media?.detailUrl || "/images/products/vaahansafe-qr-sticker-thumb.jpg"
      : media?.thumbUrl || "/images/products/vaahansafe-qr-sticker-thumb.jpg";

  const altText = alt || media?.altText || "VaahanSafe Automotive Safety QR Kit";

  if (hasError || !src) {
    return <ProductMediaFallback variant={variant} className={className} />;
  }

  if (variant === "hero") {
    return (
      <div
        className={cn(
          "relative aspect-[16/10] sm:aspect-4/3 w-full overflow-hidden rounded-2xl border border-border/80 bg-[#161514] shadow-md transition-all duration-300",
          className
        )}
      >
        <Image
          src={src}
          alt={altText}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 45vw, 540px"
          className="object-cover object-center transition-transform duration-500 hover:scale-[1.02]"
          onError={() => setHasError(true)}
        />
        {/* Subtle gradient vignette to blend with dark identity surfaces */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-xl border border-border/80 bg-[#161514] shadow-xs",
          className
        )}
      >
        <Image
          src={src}
          alt={altText}
          fill
          priority={priority}
          sizes="280px"
          className="object-cover object-center"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  // Default: thumbnail (96-120px)
  return (
    <div
      className={cn(
        "relative aspect-square size-24 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-[#161514] shadow-xs sm:size-28",
        className
      )}
    >
      <Image
        src={src}
        alt={altText}
        fill
        priority={priority}
        sizes="(max-width: 640px) 96px, 112px"
        className="object-cover object-center"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
