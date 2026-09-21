"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { VaahanIcon } from "@vaahansafe/icons";
import { parseVaahanSafeQrPayload } from "@vaahansafe/qr-core/client";
import { PhysicalQrArtifact } from "./PhysicalQrArtifact";

interface IdentityHeroProps {
  onOpenScanner?: () => void;
}

export function IdentityHero({ onOpenScanner }: IdentityHeroProps) {
  const router = useRouter();
  const [lookupId, setLookupId] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  function handleLookupSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = parseVaahanSafeQrPayload(lookupId);

    if (!result.valid || !result.publicId) {
      setInputError("Enter a valid VaahanSafe ID (e.g. VS-7F3K-9021 or 7F3K9021)");
      return;
    }

    setInputError(null);
    router.push(`/${result.publicId}`);
  }

  return (
    <section className="relative w-full border-b border-border/80 bg-background overflow-hidden pt-8 pb-14 sm:pt-14 sm:pb-20 lg:pt-20 lg:pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Editorial Narrative (Desktop 6 cols) */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8 text-left">
            <div className="inline-flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary" />
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                VaahanSafe / Public QR System
              </span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-normal tracking-tight text-foreground leading-[1.08]">
              Your vehicle <br />
              can carry a <br />
              <span className="italic text-primary font-medium">safety identity.</span>
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg font-sans">
              A VaahanSafe QR connects a physical vehicle to a controlled public safety
              view &mdash; without turning the owner&apos;s private account into a public profile.
            </p>

            {/* Scan-First Primary CTA & Secondary Triggers */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              {onOpenScanner ? (
                <button
                  type="button"
                  onClick={onOpenScanner}
                  className="h-12 px-7 rounded-xl bg-primary text-primary-foreground font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 hover:bg-primary/90 active:scale-[0.99] transition-all shadow-md cursor-pointer"
                >
                  <VaahanIcon name="qr" size={17} />
                  <span>Scan VaahanSafe QR</span>
                </button>
              ) : (
                <a
                  href="#how-it-works"
                  className="h-12 px-6 rounded-xl bg-foreground text-background font-medium text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-foreground/90 active:scale-[0.99] transition-all shadow-xs"
                >
                  <span>How it works</span>
                  <VaahanIcon name="chevron-down" size={14} />
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  document.getElementById("hero-lookup-input")?.focus();
                }}
                className="h-12 px-5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium text-xs flex items-center justify-center gap-1.5 transition-colors border border-border cursor-pointer"
              >
                <span>Enter QR ID</span>
                <VaahanIcon name="arrow-right" size={13} />
              </button>

              <a
                href="#how-it-works"
                className="hidden sm:flex h-12 px-3 text-muted-foreground hover:text-foreground text-xs font-medium items-center justify-center gap-1 transition-colors"
              >
                <span>How it works ↓</span>
              </a>
            </div>

            {/* Direct ID Lookup Bar */}
            <div className="pt-4 border-t border-border/60 max-w-md">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-2">
                Have a sticker ID? Test resolution directly:
              </span>
              <form onSubmit={handleLookupSubmit} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <input
                    id="hero-lookup-input"
                    type="text"
                    value={lookupId}
                    onChange={(e) => {
                      setLookupId(e.target.value);
                      if (inputError) setInputError(null);
                    }}
                    placeholder="e.g. VS-7F3K-9021 or 7F3K9021"
                    className="flex-1 h-10 px-3 rounded-lg border border-border bg-card font-mono text-xs uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal focus:outline-hidden focus:ring-2 focus:ring-primary/40 transition-all"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="submit"
                    className="h-10 px-4 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs uppercase tracking-wider flex items-center gap-1 border border-border transition-colors shrink-0 cursor-pointer"
                  >
                    <span>Resolve</span>
                    <VaahanIcon name="arrow-right" size={12} />
                  </button>
                </div>
                {inputError && (
                  <p className="text-[11px] text-destructive">{inputError}</p>
                )}
              </form>
            </div>
          </div>

          {/* Right Column: Physical-to-Digital Artifact Composition (Desktop 6 cols) */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <PhysicalQrArtifact demoId="VS-7F3K-9021" className="w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
