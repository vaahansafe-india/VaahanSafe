"use client";

import * as React from "react";
import Image from "next/image";
import type {
  EditorialFrame,
  ArticleFocalPoint,
  ArticleMediaRole,
} from "@vaahansafe/content";
import { EditorialMediaFallback } from "./EditorialMediaFallback";

interface EditorialMediaProps {
  src?: string;
  alt: string;
  frame?: EditorialFrame;
  aspectRatio?: string;
  caption?: string;
  category?: string;
  indexNumber?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  focalPoint?: ArticleFocalPoint;
  role?: ArticleMediaRole;
}

export function EditorialMedia({
  src,
  alt,
  frame = "OFFSET_LANDSCAPE",
  aspectRatio = "16/10",
  caption,
  category,
  indexNumber,
  priority = false,
  sizes = "(min-width: 1280px) 60vw, 100vw",
  className = "",
  focalPoint,
  role = "HERO",
}: EditorialMediaProps) {
  const [hasError, setHasError] = React.useState(false);

  if (!src || hasError) {
    return (
      <EditorialMediaFallback
        category={category}
        indexNumber={indexNumber}
        aspectRatio={aspectRatio}
        caption={caption}
        role={role}
      />
    );
  }

  // Frame treatments
  let frameClasses = "rounded-xl sm:rounded-2xl";
  if (frame === "FULL_BLEED") {
    frameClasses = "rounded-none sm:rounded-xl";
  } else if (frame === "TALL_PORTRAIT") {
    frameClasses = "rounded-xl";
  } else if (frame === "CROPPED_DETAIL") {
    frameClasses = "rounded-lg";
  } else if (frame === "INSET_TECHNICAL") {
    frameClasses = "rounded-none border border-[#e6dfd8] dark:border-[#2e2b27] p-1 bg-[#f5f0e8]/50 dark:bg-[#1f1e1b]/50";
  } else if (frame === "DARK_FIELD") {
    frameClasses = "rounded-xl bg-[#141413] border border-[#2e2b27]";
  }

  const objectPosition = focalPoint
    ? `${focalPoint.x}% ${focalPoint.y}%`
    : "50% 50%";

  return (
    <figure className={`group/media flex flex-col space-y-2.5 ${className}`}>
      <div
        className={`relative w-full overflow-hidden bg-[#f5f0e8] dark:bg-[#1f1e1b] ${frameClasses}`}
        style={{ aspectRatio }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          style={{ objectPosition }}
          onError={(e) => {
            if (e && typeof e.stopPropagation === "function") {
              e.stopPropagation();
            }
            setHasError(true);
          }}
          className="object-cover transition-transform duration-700 ease-out group-hover/media:scale-[1.018]"
        />
      </div>

      {/* Technical Editorial Caption */}
      {caption && (
        <figcaption className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-[#8e8b82] dark:text-[#77736d]">
          <span>{caption}</span>
          <span className="h-1 w-1 rounded-full bg-[#cc785c]" />
        </figcaption>
      )}
    </figure>
  );
}
