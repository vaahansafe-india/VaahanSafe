"use client";

import * as React from "react";

export function ReadingProgressBar() {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const current = (window.scrollY / totalHeight) * 100;
        setProgress(Math.min(100, Math.max(0, current)));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="fixed top-16 left-0 right-0 z-40 h-0.5 bg-border/40 pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="h-full bg-[#cc785c] transition-all duration-75"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
