import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { getActivateUrl, getWebUrl } from "@vaahansafe/config";

export function FinalIdentityStatement() {
  const activateUrl = getActivateUrl();
  const webUrl = getWebUrl();

  return (
    <section className="qr-section text-center">
      <div className="qr-container max-w-4xl space-y-10">
        <div className="space-y-4">
          <span className="qr-label">
            One Architecture &bull; Universal Safety
          </span>

          <h2 className="qr-section-title mt-3">
            One vehicle. <br />
            One QR identity. <br />
            <span className="italic text-primary font-medium">A controlled public connection.</span>
          </h2>

          <p className="qr-muted mt-5 text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-sans">
            Ready to give your vehicle a safe, authenticated roadside identity?
            Activate your sticker pack or discover the VaahanSafe platform today.
          </p>
        </div>

        {/* Visual Milestone Line */}
        <div className="py-2 flex items-center justify-center gap-4 text-xs font-mono uppercase tracking-wider qr-muted">
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
          <span className="flex items-center gap-1.5 text-[var(--qr-accent)] font-semibold">
            <span className="size-2 rounded-full bg-[var(--qr-accent)] ring-2 ring-[var(--qr-accent)]/20" />
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
            className="qr-button qr-button-primary w-full sm:w-auto"
          >
            <span>Activate your QR</span>
            <VaahanIcon name="arrow-right" size={14} />
          </a>

          <a
            href={webUrl}
            className="qr-button w-full sm:w-auto"
          >
            <span>VaahanSafe Home</span>
            <VaahanIcon name="external-link" size={13} />
          </a>
        </div>
      </div>
    </section>
  );
}
