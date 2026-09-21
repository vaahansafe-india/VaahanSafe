import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function ReplacementIdentityCard() {
  return (
    <div className="my-8 overflow-hidden rounded-xl border border-white/[0.08] bg-[#09090b] p-6 text-[#fafafa] sm:p-8">
      <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.2em] text-[#cc785c]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
        <span>Signature Architecture • Identity Continuity</span>
      </div>

      <h3 className="mt-3 font-serif text-xl font-normal tracking-[-0.02em] text-[#fafafa] sm:text-2xl">
        The physical QR can change. The vehicle identity is the important part.
      </h3>

      <p className="mt-2 text-xs leading-relaxed text-[#a1a1aa] sm:text-sm sm:leading-7">
        Where supported by the applicable replacement workflow, pairing a replacement decal transfers the public access point while preserving your vehicle history and emergency configurations.
      </p>

      {/* Continuity Diagram */}
      <div className="mt-6 grid gap-3 sm:grid-cols-4 sm:gap-3">
        <div className="rounded-lg border border-white/[0.06] bg-[#18181b] p-4">
          <span className="font-mono text-[7px] uppercase tracking-[0.14em] text-[#71717a]">
            Prior Hardware
          </span>
          <p className="mt-1 font-mono text-xs font-semibold text-[#fafafa]">
            Current QR
          </p>
          <span className="mt-1 block font-mono text-[10px] text-[#cc785c]/80">
            VS / QR / 01
          </span>
          <span className="mt-2 block text-[10px] text-[#71717a]">
            Damaged, weathered or displaced
          </span>
        </div>

        <div className="rounded-lg border border-white/[0.06] bg-[#18181b] p-4">
          <span className="font-mono text-[7px] uppercase tracking-[0.14em] text-[#71717a]">
            Verification
          </span>
          <p className="mt-1 font-mono text-xs font-semibold text-[#fafafa]">
            Replacement Process
          </p>
          <span className="mt-1 block text-[10px] text-[#a1a1aa]">
            Owner authenticated; prior token revoked
          </span>
        </div>

        <div className="rounded-lg border border-white/[0.06] bg-[#18181b] p-4">
          <span className="font-mono text-[7px] uppercase tracking-[0.14em] text-[#71717a]">
            New Optical Gateway
          </span>
          <p className="mt-1 font-mono text-xs font-semibold text-[#fafafa]">
            New QR
          </p>
          <span className="mt-1 block font-mono text-[10px] text-[#5db8a6]">
            VS / QR / 02
          </span>
          <span className="mt-2 block text-[10px] text-[#71717a]">
            Fresh hardware paired to vehicle
          </span>
        </div>

        <div className="rounded-lg border border-[#cc785c]/40 bg-[#18181b] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[7px] uppercase tracking-[0.14em] text-[#cc785c]">
              Persistent Anchor
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#5db8a6]" />
          </div>
          <p className="mt-1 font-mono text-xs font-semibold text-[#cc785c]">
            Vehicle Identity
          </p>
          <span className="mt-1 block font-mono text-[10px] text-[#fafafa]">
            VS-7F3K-9021
          </span>
          <span className="mt-2 block text-[10px] text-[#5db8a6]">
            Safety view & plan continue
          </span>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 border-t border-white/[0.08] pt-4 text-xs text-muted-foreground">
        <VaahanIcon name="shield" size={12} className="text-[#5db8a6]" />
        <span>After a replacement is completed, the previous QR code is deactivated from the resolver to prevent duplicate resolution ambiguity.</span>
      </div>
    </div>
  );
}
