import * as React from "react";
import type { ArticleMediaRole } from "@vaahansafe/content";

interface EditorialMediaFallbackProps {
  category?: string;
  indexNumber?: string;
  aspectRatio?: string;
  caption?: string;
  role?: ArticleMediaRole;
}

export function EditorialMediaFallback({
  category = "VEHICLE SAFETY",
  indexNumber = "VS",
  aspectRatio = "16/10",
  caption,
  role = "HERO",
}: EditorialMediaFallbackProps) {
  const normCategory = (category || "VEHICLE SAFETY").toUpperCase().trim();

  // Deterministic category visual variants
  const isPrivacy = normCategory.includes("PRIVACY");
  const isQrIdentity = normCategory.includes("QR") || normCategory.includes("IDENTITY");
  const isVehicleSafety = normCategory.includes("SAFETY") || normCategory.includes("VEHICLE");
  const isProduct = normCategory.includes("PRODUCT") || normCategory.includes("UPDATE");

  return (
    <div
      className="relative flex w-full flex-col justify-between overflow-hidden border border-[#e6dfd8] bg-[#f5f0e8] p-6 sm:p-8 dark:border-[#2e2b27] dark:bg-[#1f1e1b] transition-colors"
      style={{ aspectRatio }}
      role="img"
      aria-label={`Editorial visual representation for ${category}`}
    >
      {/* Background Architectural Grid Lines */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.07]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="editorial-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#editorial-grid)" />
        </svg>
      </div>

      {/* Top Registration Eyebrow */}
      <div className="relative z-10 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.24em] text-[#8e8b82] dark:text-[#77736d]">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
          <span>VAAHANSAFE / JOURNAL &bull; {role}</span>
        </div>
        <span>STORY / {indexNumber}</span>
      </div>

      {/* Center Deterministic Geometric Identity Field */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center space-y-4 py-6 text-center">
        {isPrivacy && (
          /* Privacy: Projection geometry with dual barrier nodes & shield line */
          <div className="w-full max-w-[280px] space-y-2">
            <div className="flex items-center justify-end">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
              <span className="h-px w-24 bg-[#cc785c]/60" />
            </div>
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[#3d3d3a] dark:text-[#c2bfb6]">
              {category}
            </div>
            <div className="flex items-center justify-start">
              <span className="h-px w-24 bg-[#cc785c]/60" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
            </div>
          </div>
        )}

        {isQrIdentity && (
          /* QR & Identity: Target matrix coordinates with identity node */
          <div className="w-full max-w-[280px] space-y-2">
            <div className="flex items-center justify-between font-mono text-[8px] text-[#8e8b82]">
              <span>[0, 0]</span>
              <span className="h-px flex-1 mx-3 bg-[#e6dfd8] dark:bg-[#2e2b27]" />
              <span>[1, 0]</span>
            </div>
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[#3d3d3a] dark:text-[#c2bfb6]">
              {category}
            </div>
            <div className="flex items-center justify-between font-mono text-[8px] text-[#8e8b82]">
              <span>[0, 1]</span>
              <span className="h-px flex-1 mx-3 bg-[#e6dfd8] dark:bg-[#2e2b27]" />
              <span>[1, 1]</span>
            </div>
          </div>
        )}

        {isVehicleSafety && (
          /* Vehicle Safety: Perimeter rail with lateral identity nodes */
          <div className="w-full max-w-[280px] space-y-2">
            <div className="flex items-center justify-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5db8a6]" />
              <span className="h-px w-16 bg-[#5db8a6]/70" />
              <span className="h-2 w-2 rounded-full border border-[#cc785c] bg-transparent" />
              <span className="h-px w-16 bg-[#5db8a6]/70" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#5db8a6]" />
            </div>
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[#3d3d3a] dark:text-[#c2bfb6]">
              {category}
            </div>
          </div>
        )}

        {isProduct && (
          /* Product: Dual-layer system bridges */
          <div className="w-full max-w-[280px] space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="h-px w-12 bg-[#cc785c]" />
              <span className="h-2 w-2 rounded-sm bg-[#cc785c]/30 border border-[#cc785c]" />
              <span className="h-px w-12 bg-[#cc785c]" />
            </div>
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[#3d3d3a] dark:text-[#c2bfb6]">
              {category}
            </div>
          </div>
        )}

        {!isPrivacy && !isQrIdentity && !isVehicleSafety && !isProduct && (
          /* Default Architectural Registry Nodes */
          <div className="w-full max-w-[240px] space-y-2">
            <div className="flex items-center justify-center gap-3">
              <span className="h-px flex-1 bg-[#e6dfd8] dark:bg-[#2e2b27]" />
              <span className="h-2 w-2 rounded-full border border-[#cc785c] bg-transparent" />
              <span className="h-px flex-1 bg-[#e6dfd8] dark:bg-[#2e2b27]" />
            </div>
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3d3d3a] dark:text-[#c2bfb6]">
              {category}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Technical Caption Rail */}
      <div className="relative z-10 flex items-center justify-between border-t border-[#e6dfd8] pt-3 font-mono text-[8px] uppercase tracking-wider text-[#8e8b82] dark:border-[#2e2b27] dark:text-[#77736d]">
        <span>OPTICAL IDENTITY RECORD</span>
        <span>{caption || "VAAHANSAFE EDITORIAL FIELD"}</span>
      </div>
    </div>
  );
}
