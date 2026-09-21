import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { getActivateUrl, getWebUrl } from "@vaahansafe/config";

export function FinalIdentityStatement() {
  const activateUrl = getActivateUrl();
  const webUrl = getWebUrl();

  return (
    <section className="w-full py-20 sm:py-28 border-b border-border/80 bg-card/20 text-center">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="space-y-4">
          <span className="font-mono text-xs uppercase tracking-widest text-primary font-semibold">
            One Architecture &bull; Universal Safety
          </span>

          <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-foreground leading-[1.12]">
            One vehicle. <br />
            One QR identity. <br />
            <span className="italic text-primary font-medium">A controlled public connection.</span>
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto font-sans">
            Ready to give your vehicle a safe, authenticated roadside identity?
            Activate your sticker pack or discover the VaahanSafe platform today.
          </p>
        </div>

        {/* Visual Milestone Line */}
        <div className="py-2 flex items-center justify-center gap-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">
          <span className="flex items-center gap-1.5 text-foreground font-semibold">
            <span className="size-2 rounded-full bg-foreground" />
            <span>Vehicle</span>
          </span>
          <span>&mdash;&bull;&mdash;</span>
          <span className="flex items-center gap-1.5 text-foreground font-semibold">
            <span className="size-2 rounded-full bg-foreground" />
            <span>QR</span>
          </span>
          <span>&mdash;&bull;&mdash;</span>
          <span className="flex items-center gap-1.5 text-primary font-semibold">
            <span className="size-2 rounded-full bg-primary ring-2 ring-primary/20" />
            <span>Public View</span>
          </span>
          <span>&mdash;&bull;&mdash;</span>
          <span className="flex items-center gap-1.5 text-foreground font-semibold">
            <span className="size-2 rounded-full bg-foreground" />
            <span>Connection</span>
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <a
            href={activateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.99] transition-all shadow-xs w-full sm:w-auto"
          >
            <span>Activate QR</span>
            <VaahanIcon name="arrow-right" size={14} />
          </a>

          <a
            href={webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-12 px-6 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium text-xs flex items-center justify-center gap-2 transition-colors border border-border w-full sm:w-auto"
          >
            <span>VaahanSafe Home</span>
            <VaahanIcon name="external-link" size={13} />
          </a>
        </div>
      </div>
    </section>
  );
}
