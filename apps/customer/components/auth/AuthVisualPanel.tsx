"use client";

import type { ReactNode, SyntheticEvent } from "react";

function preventArtworkAction(event: SyntheticEvent) {
  event.preventDefault();
}

export function AuthVisualPanel({ children }: { children: ReactNode }) {
  return (
    <aside
      className="relative hidden h-full select-none overflow-hidden border-r border-[#e2dcd2] bg-[#f5f0e8] text-[#1b1c1a] lg:flex lg:flex-col [&_img]:pointer-events-none [-webkit-touch-callout:none]"
      style={{ backgroundImage: "url('/images/auth/paper-texture.webp')", backgroundRepeat: "repeat", backgroundSize: "400px 400px" }}
      draggable={false}
      onContextMenu={preventArtworkAction}
      onDragStart={preventArtworkAction}
      onCopy={preventArtworkAction}
    >
      {children}
    </aside>
  );
}
