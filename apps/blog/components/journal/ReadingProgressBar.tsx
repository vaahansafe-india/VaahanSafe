"use client";
import { useEffect, useRef } from "react";

export function ReadingProgressBar() {
  const progressRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    function update() {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const progress =
        total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
      if (progressRef.current)
        progressRef.current.style.transform = `scaleX(${progress})`;
      frame = 0;
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px]"
    >
      <div
        ref={progressRef}
        className="h-full origin-left bg-[var(--journal-accent)]"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
