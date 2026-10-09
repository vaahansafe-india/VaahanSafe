"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface AdminPageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Subtle entrance animation wrapper for freshly resolved admin pages.
 * 140ms duration with small 3px translation.
 * Disabled completely when prefers-reduced-motion is enabled.
 */
export function AdminPageTransition({
  children,
  className = "",
}: AdminPageTransitionProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={`admin-page-transition-content ${className}`}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.14,
        ease: [0.2, 0, 0, 1],
      }}
      className={`admin-page-transition-content ${className}`}
    >
      {children}
    </motion.div>
  );
}
