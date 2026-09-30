"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";

export function ParallaxImage({ src, alt, sizes }: { src: string; alt: string; sizes: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const y = useTransform(progress, [0, 1], [-30, 30]);
  return <div className="vs-photo-parallax" ref={ref}><motion.div className="vs-photo-parallax-inner" style={{ y: reducedMotion ? 0 : y }}><Image src={src} alt={alt} fill sizes={sizes} /></motion.div></div>;
}
