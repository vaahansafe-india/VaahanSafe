"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { getCustomerUrl } from "@vaahansafe/config";

const scenes = [
  { src: "/images/hero-city.webp", label: "For every drive", position: "72% bottom" },
  { src: "/images/hero-coast.webp", label: "For every ride", position: "23% bottom" },
  { src: "/images/hero-motorcycle.webp", label: "For every journey", position: "76% bottom" },
] as const;

export function HeroBackdrop() {
  const ref = useRef<HTMLElement>(null);
  const [scene, setScene] = useState(0);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const progress = useSpring(scrollYProgress, { stiffness: 110, damping: 30, restDelta: 0.001 });
  const y = useTransform(progress, [0, 1], [0, 90]);
  const copyY = useTransform(progress, [0, 0.7], [0, -65]);
  const copyOpacity = useTransform(progress, [0, 0.25, 0.62], [1, 0.95, 0]);
  const copyScale = useTransform(progress, [0, 0.65], [1, 0.97]);
  const currentScene = scenes[scene] ?? scenes[0];

  useEffect(() => {
    const timer = setInterval(() => {
      setScene(prev => (prev + 1) % scenes.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section ref={ref} className="vs-hero" aria-labelledby="home-title">
      <div className="vs-hero-media" aria-hidden="true">
        <motion.div className="vs-hero-media-inner" style={{ y: reducedMotion ? 0 : y }}>
          {scenes.map((item, index) => (
            <div
              key={item.src}
              className={`vs-hero-slide ${scene === index ? "is-active" : ""}`}
              style={{ "--scene-position": item.position } as CSSProperties}
            >
              <Image
                className="vs-hero-image"
                src={item.src}
                alt=""
                fill
                priority
                sizes="100vw"
              />
            </div>
          ))}
        </motion.div>
      </div>
      <motion.div className="vs-container vs-hero-content" style={{ y: reducedMotion ? 0 : copyY, opacity: reducedMotion ? 1 : copyOpacity, scale: reducedMotion ? 1 : copyScale }}>
        <span className="vs-kicker"><span className="vs-signal" /> VEHICLE SAFETY, CONNECTED</span>
        <h1 id="home-title">VaahanSafe.<br /><em>A clearer way to help.</em></h1>
        <p>A small QR on your vehicle. A clear path to the safety information and contact options you choose to share.</p>
        <div className="vs-hero-actions"><a className="vs-button vs-button-coral" href={getCustomerUrl()}>Get VaahanSafe <ArrowUpRight size={18} /></a><Link className="vs-button vs-button-paper" href="/product">Explore the product <ArrowRight size={18} /></Link></div>
      </motion.div>
      <div className="vs-hero-bottom">
        <span className="vs-hero-caption">{currentScene.label}<small>Cars, scooters & motorcycles</small></span>
        <a className="vs-hero-scroll" href="#what-is-vaahansafe" aria-label="Discover VaahanSafe" onClick={(e) => { e.preventDefault(); document.getElementById("what-is-vaahansafe")?.scrollIntoView({ behavior: "smooth" }); }}><ArrowDown size={18} /></a>
        <div className="vs-hero-bottom-spacer" aria-hidden="true" />
      </div>
    </section>
  );
}
