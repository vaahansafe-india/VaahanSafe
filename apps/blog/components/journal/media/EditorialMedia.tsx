"use client";

import * as React from "react";
import Image from "next/image";
import type {
  EditorialFrame,
  ArticleFocalPoint,
  ArticleMediaRole,
} from "@vaahansafe/content";
import { EditorialMediaFallback } from "./EditorialMediaFallback";

const localImageDescriptions: Record<string, string> = {
  "/images/editorial/vehicle-placement-hero.jpg":
    "Silver sedan with a vehicle safety QR decal on its windshield.",
  "/images/editorial/car-windshield-placement.jpg":
    "Close view of a QR decal on the clear area of a car windshield, beside its dotted border.",
  "/images/editorial/helmet-placement.jpg":
    "Full-face motorcycle helmet with a small identity marker on its side.",
  "/images/editorial/scooter-placement.jpg":
    "Red scooter parked beside a building, with an identity marker on its front panel.",
  "/images/editorial/windshield-decal-bonding.jpg":
    "Hands positioning a vehicle safety QR decal on the inside of a windshield.",
  "/images/editorial/emergency-contact-relays.jpg":
    "Person receiving an emergency relay call beside a stopped car at dusk.",
  "/images/editorial/motorcycle-placement.jpg":
    "Black motorcycle with a brown seat and a QR decal on its side panel.",
  "/images/editorial/edge-routing-emergency-alerts.jpg":
    "Light trails on a city highway at dusk beneath illuminated road signs.",
};

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
  React.useEffect(() => {
    setHasError(false);
  }, [src]);

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

  const frameClasses =
    frame === "INSET_TECHNICAL" ? "journal-media p-1" : "journal-media";

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
          alt={localImageDescriptions[src] || alt}
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
          className="object-cover transition-transform duration-300 ease-out group-hover/media:scale-[1.018] motion-reduce:transform-none"
        />
      </div>

      {/* Technical Editorial Caption */}
      {caption && (
        <figcaption className="journal-media-caption flex items-center justify-between gap-3">
          <span>{caption}</span>
          <span className="h-1 w-1 rounded-full bg-[#cc785c]" />
        </figcaption>
      )}
    </figure>
  );
}
