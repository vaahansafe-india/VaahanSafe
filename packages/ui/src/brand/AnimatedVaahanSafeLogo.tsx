"use client";
import * as React from "react";
import type { AnimatedVaahanSafeLogoProps } from "./brand.types";
import { AnimatedVaahanSafeMark } from "./AnimatedVaahanSafeMark";
import { BrandWordmark, VaahanSafeLogo } from "./VaahanSafeLogo";
import { BRAND_MOTION, LOGO_SIZES } from "./brand.constants";
import { useReducedMotion } from "./useReducedMotion";

export function AnimatedVaahanSafeLogo({
  size = "md",
  orientation = "horizontal",
  variant = "brand",
  theme,
  autoPlay = true,
  onComplete,
  reducedMotion = false,
  className = "",
  href,
  showTagline = false,
  ...rest
}: AnimatedVaahanSafeLogoProps) {
  const reduce = useReducedMotion(reducedMotion);
  const [completed, setCompleted] = React.useState(false);
  const callback = React.useRef(onComplete);
  const notified = React.useRef(false);
  React.useEffect(() => {
    callback.current = onComplete;
  }, [onComplete]);
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
    }, BRAND_MOTION.reveal + BRAND_MOTION.wordmark);
    return () => clearTimeout(timer);
  }, [autoPlay, reduce]);
  if (!autoPlay || reduce || completed)
    return (
      <VaahanSafeLogo
        size={size}
        orientation={orientation}
        variant={variant}
        theme={theme}
        className={className}
        href={href}
        showTagline={showTagline}
        {...rest}
      />
    );
  const config = LOGO_SIZES[size];
  const hidden = rest["aria-hidden"] === true || rest["aria-hidden"] === "true";
  const content = (
    <span
      {...rest}
      className={`vs-logo vs-animated-logo ${orientation === "stacked" ? "vs-logo-stacked" : ""} ${className}`}
      style={{ gap: config.gap, ...rest.style }}
      role={hidden ? undefined : "img"}
      aria-label={hidden ? undefined : (rest["aria-label"] ?? "VaahanSafe")}
    >
      <AnimatedVaahanSafeMark
        size={config.mark}
        variant={theme ?? variant}
        aria-hidden="true"
      />
      <span className="vs-wordmark-enter">
        <BrandWordmark
          variant={theme ?? variant}
          textSize={config.text}
          showTagline={showTagline}
        />
      </span>
    </span>
  );
  return href ? (
    <a href={href} className="vs-logo-link" aria-label="VaahanSafe home">
      {content}
    </a>
  ) : (
    content
  );
}
