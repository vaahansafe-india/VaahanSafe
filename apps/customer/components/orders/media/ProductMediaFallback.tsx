"use client";

import { cn } from "@vaahansafe/ui/lib/utils";
import { VaahanIcon } from "@vaahansafe/icons";

interface ProductMediaFallbackProps {
  variant?: "hero" | "thumbnail" | "detail";
  className?: string;
}

export function ProductMediaFallback({
  variant = "thumbnail",
  className,
}: ProductMediaFallbackProps) {
  if (variant === "hero") {
    return (
      <div
        className={cn(
          "relative flex aspect-[16/10] sm:aspect-4/3 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-[#1f1e1c] to-[#141312] p-4 sm:p-6 pb-12 sm:pb-14 text-white shadow-md",
          className
        )}
      >
        {/* Subtle decorative background geometry */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(204,120,92,0.12),transparent_70%)] pointer-events-none" />
        <div className="absolute -right-12 -top-12 size-48 rounded-full border border-white/5 pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 size-48 rounded-full border border-white/5 pointer-events-none" />

        {/* Brand crest & motif */}
        <div className="relative flex flex-col items-center text-center">
          <div className="flex size-10 sm:size-12 lg:size-14 items-center justify-center rounded-xl sm:rounded-2xl border border-[#cc785c]/30 bg-[#cc785c]/10 text-[#cc785c] shadow-inner backdrop-blur-xs">
            <VaahanIcon name="qr" className="size-5 sm:size-7" />
          </div>

          <div className="mt-2.5 sm:mt-4 font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.24em] sm:tracking-[0.28em] text-[#cc785c]">
            VaahanSafe Identity Kit
          </div>
          <div className="mt-0.5 sm:mt-1 font-serif text-sm sm:text-base lg:text-lg font-medium text-white/90">
            Automotive QR Hardware
          </div>
          <p className="mt-1 max-w-xs text-[11px] sm:text-xs text-white/50 px-2 line-clamp-2">
            Industrial tamper-proof vehicle safety sticker &amp; companion card
          </p>

          <div className="mt-2 sm:mt-3 inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 sm:px-3 py-0.5 sm:py-1 font-mono text-[9px] sm:text-[10px] text-white/70">
            <VaahanIcon name="shield" className="size-2.5 sm:size-3 text-[#cc785c]" />
            <span>Encrypted Physical Identity</span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div
        className={cn(
          "relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-[#1a1918] p-4 text-white shadow-xs",
          className
        )}
      >
        <div className="flex size-10 items-center justify-center rounded-xl border border-[#cc785c]/30 bg-[#cc785c]/10 text-[#cc785c]">
          <VaahanIcon name="qr" className="size-5" />
        </div>
        <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c]">
          QR Kit
        </div>
      </div>
    );
  }

  // Default: thumbnail (96-120px)
  return (
    <div
      className={cn(
        "relative flex aspect-square size-24 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border border-border/80 bg-[#1a1918] p-2 text-white shadow-xs sm:size-28",
        className
      )}
    >
      <div className="flex size-8 items-center justify-center rounded-lg border border-[#cc785c]/30 bg-[#cc785c]/10 text-[#cc785c]">
        <VaahanIcon name="qr" className="size-4" />
      </div>
      <div className="mt-1.5 font-mono text-[8px] uppercase tracking-[0.16em] text-[#cc785c]">
        QR Kit
      </div>
    </div>
  );
}
