"use client";
import * as React from "react";

const query = "(prefers-reduced-motion: reduce)";
function subscribe(callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
/** CSS also covers the server-rendered frame before hydration. */
export function useReducedMotion(explicit = false) {
  const system = React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
  return explicit || system;
}
