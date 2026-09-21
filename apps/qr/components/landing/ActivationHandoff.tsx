import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { getActivateUrl } from "@vaahansafe/config";

export function ActivationHandoff() {
  const activateUrl = getActivateUrl();

  return (
    <section className="w-full py-16 sm:py-24 border-b border-border/80 bg-card/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl border-2 border-border/90 bg-card shadow-sm space-y-8">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary font-semibold">
              <span>06</span>
              <span>&bull;</span>
              <span>Retail Packaging</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-foreground leading-[1.15]">
              Have an unactivated <br />
              <span className="italic text-primary font-medium">VaahanSafe QR pack?</span>
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              If you recently purchased an official sticker pack from an authorized dealer or retailer,
              connect it to your vehicle identity in under two minutes through our dedicated activation portal.
            </p>
          </div>

          {/* Graphic Milestone Sequence: Physical QR -> Activate -> Vehicle Identity */}
          <div className="p-6 rounded-2xl bg-background border border-border/70 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-foreground" />
                <span className="font-bold text-foreground uppercase">Physical QR Sticker</span>
              </div>

              <div className="flex-1 flex items-center justify-center gap-2 text-primary font-semibold">
                <div className="hidden sm:block flex-1 h-px bg-primary/40" />
                <span>&mdash; SECURE ACTIVATION &mdash;</span>
                <div className="hidden sm:block flex-1 h-px bg-primary/40" />
              </div>

              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-primary" />
                <span className="font-bold text-primary uppercase">Vehicle Safety Identity</span>
              </div>
            </div>

            <div className="pt-2 text-center">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                One Physical QR &bull; One Controlled Vehicle Identity &bull; Atomic Server Binding
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <a
              href={activateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.99] transition-all shadow-xs"
            >
              <span>Activate Your Sticker</span>
              <VaahanIcon name="arrow-right" size={14} />
            </a>

            <span className="text-xs text-muted-foreground text-center sm:text-left font-sans">
              Requires your vehicle registration plate and the scratch secret on your package card.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
