"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ICON_REGISTRY, VaahanIconName } from "./registry";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export interface VaahanIconProps extends React.SVGAttributes<SVGSVGElement> {
  name: VaahanIconName;
  size?: number | string;
  strokeWidth?: number;
  color?: string;
  className?: string;
  "aria-label"?: string;
  alt?: string;
}

export function VaahanIcon({
  name,
  size = 20,
  strokeWidth = 1.5,
  color = "currentColor",
  className,
  "aria-label": ariaLabel,
  alt,
  ...props
}: VaahanIconProps) {
  const iconData = ICON_REGISTRY[name];

  if (!iconData) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[VaahanIcon] Unknown icon name: "${name}"`);
    }
    return null;
  }

  const label = ariaLabel || alt;
  const isAriaHidden = label ? undefined : true;

  return (
    <span
      className={cn("inline-flex items-center justify-center shrink-0 leading-none", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={isAriaHidden}
    >
      <HugeiconsIcon
        icon={iconData}
        size={typeof size === "string" ? parseInt(size, 10) || 20 : size}
        color={color}
        strokeWidth={strokeWidth}
        {...props}
      />
    </span>
  );
}
