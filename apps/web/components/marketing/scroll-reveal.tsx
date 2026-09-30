"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

export function ScrollReveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, margin: "0px 0px -48px 0px", amount: 0.12 });
  const reducedMotion = useReducedMotion();
  return <motion.div ref={ref} className={className} initial={false} animate={reducedMotion || visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }} transition={{ duration: reducedMotion ? 0 : 0.85, delay: reducedMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}
