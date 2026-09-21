import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function SafetyViewTermsCallout() {
  return (
    <div className="my-8 overflow-hidden rounded-xl border border-white/[0.08] bg-[#09090b] p-6 text-[#fafafa] sm:p-8">
      <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.2em] text-[#cc785c]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
        <span>Privacy Architecture • Public Boundary</span>
      </div>

      <h3 className="mt-3 font-serif text-xl font-normal tracking-[-0.02em] text-[#fafafa] sm:text-2xl">
        A scan opens a safety view — not the entire account.
      </h3>

      <p className="mt-2 text-xs leading-relaxed text-[#a1a1aa] sm:text-sm sm:leading-7">
        When someone scans your physical QR on the road, our resolver exposes only the emergency and vehicle safety parameters you explicitly chose to display.
      </p>

      {/* 3-Stage Boundary Model */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-white/[0.06] bg-[#18181b] p-4">
          <span className="font-mono text-[7px] uppercase tracking-[0.14em] text-[#71717a]">
            Layer 01
          </span>
          <p className="mt-1 font-mono text-xs font-semibold text-[#fafafa]">
            Private Account
          </p>
          <ul className="mt-2 space-y-1 text-[11px] text-[#a1a1aa]">
            <li>• Mobile number login</li>
            <li>• Residential address</li>
            <li>• Payment history</li>
            <li className="text-[#c64545]">• Never exposed publicly</li>
          </ul>
        </div>

        <div className="rounded-lg border border-[#cc785c]/30 bg-[#18181b] p-4">
          <span className="font-mono text-[7px] uppercase tracking-[0.14em] text-[#cc785c]">
            Layer 02
          </span>
          <p className="mt-1 font-mono text-xs font-semibold text-[#cc785c]">
            Owner Control
          </p>
          <ul className="mt-2 space-y-1 text-[11px] text-[#a1a1aa]">
            <li>• Field-by-field toggles</li>
            <li>• Emergency contact selection</li>
            <li>• Discretionary medical notes</li>
            <li className="text-[#5db8a6]">• Real-time updates</li>
          </ul>
        </div>

        <div className="rounded-lg border border-white/[0.06] bg-[#18181b] p-4">
          <span className="font-mono text-[7px] uppercase tracking-[0.14em] text-[#71717a]">
            Layer 03
          </span>
          <p className="mt-1 font-mono text-xs font-semibold text-[#fafafa]">
            Safety View
          </p>
          <ul className="mt-2 space-y-1 text-[11px] text-[#a1a1aa]">
            <li>• Vehicle registration tag</li>
            <li>• Verified emergency dialer</li>
            <li>• Blood group indicator</li>
            <li className="text-[#5db8a6]">• Roadside assist context</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 border-t border-white/[0.08] pt-4 text-[11px] text-muted-foreground">
        <VaahanIcon name="shield" size={12} className="text-[#5db8a6]" />
        <span>Owner address, personal email, and financial transaction records are strictly isolated and never rendered in the public view.</span>
      </div>
    </div>
  );
}
