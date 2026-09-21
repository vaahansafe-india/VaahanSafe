"use client";
import * as React from "react";
import type { AnimatedVaahanSafeMarkProps } from "./brand.types";
import { VaahanSafeMark } from "./VaahanSafeMark";
import { BrandPaths } from "./BrandPaths";
import { BRAND_MOTION, markColors } from "./brand.constants";
import { useReducedMotion } from "./useReducedMotion";

/** One-shot reveal. Remount with a new key to replay. Final markup is the static mark. */
export function AnimatedVaahanSafeMark({
  size = 32,
  variant = "brand",
  className = "",
  autoPlay = true,
  durationMs = BRAND_MOTION.reveal,
  onComplete,
  reducedMotion = false,
  title = "VaahanSafe",
  isFavicon = false,
  ...rest
}: AnimatedVaahanSafeMarkProps) {
  const reduce = useReducedMotion(reducedMotion);
  const [completed, setCompleted] = React.useState(false);
  const callback = React.useRef(onComplete);
  const notified = React.useRef(false);
  React.useEffect(() => {
    callback.current = onComplete;
  }, [onComplete]);
  const duration = Math.max(1, durationMs);
  React.useEffect(() => {
    if (!autoPlay) {
      notified.current = false;
      return;
    }
    if (reduce) {
      setCompleted(true);
      if (!notified.current) {
        notified.current = true;
        callback.current?.();
      }
      return;
    }
    setCompleted(false);
    notified.current = false;
    const timer = setTimeout(() => {
      setCompleted(true);
      notified.current = true;
      callback.current?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [autoPlay, reduce, duration]);
  if (!autoPlay || reduce || completed || size <= 24) {
    return (
      <VaahanSafeMark
        size={size}
        variant={variant}
        className={className}
        title={title}
        isFavicon={isFavicon}
        {...rest}
      />
    );
  }
  const hidden = rest["aria-hidden"] === true || rest["aria-hidden"] === "true";
  return (
    <svg
      {...rest}
      viewBox="0 0 32 32"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      className={`vs-mark vs-reveal ${className}`}
      style={
        { "--vs-reveal": `${duration}ms`, ...rest.style } as React.CSSProperties
      }
      role={hidden ? undefined : "img"}
      aria-label={hidden ? undefined : (rest["aria-label"] ?? title)}
    >
      {!hidden && title && <title>{title}</title>}
      <BrandPaths variant={variant} compact={isFavicon} />
      <rect
        className="vs-identity-point"
        x="15"
        y="15"
        width="2"
        height="2"
        rx="0.5"
        fill={markColors(variant).frame}
      />
      <rect
        className="vs-reveal-sweep"
        x="8"
        y="8"
        width="16"
        height="0.6"
        fill={markColors(variant).frame}
      />
    </svg>
  );
}
