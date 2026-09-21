import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { getCustomerUrl } from "@vaahansafe/config";

export function PlacementFinalCta() {
  const customerUrl = getCustomerUrl();

  return (
    <section
      aria-labelledby="placement-final-cta-heading"
      className="
        border-t border-[#27272a]
        bg-[#09090b]
        py-20 sm:py-24
        text-[#fafafa]
      "
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[800px] text-center">
          <div className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[#cc785c]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
            <span>Physical Placement Ready</span>
          </div>

          <h2
            id="placement-final-cta-heading"
            className="
              mt-6 font-serif
              text-3xl font-normal leading-tight tracking-[-0.03em]
              sm:text-4xl lg:text-5xl
            "
          >
            Give your vehicle <br className="hidden sm:block" />
            <span className="text-[#cc785c]">a visible identity.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-[560px] text-sm leading-relaxed text-[#a1a1aa] sm:text-base">
            Equip your car or two-wheeler with a high-durability VaahanSafe decal. Connect the physical vehicle to privacy-controlled roadside safety in minutes.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href={`${customerUrl}/order`}
              className="
                inline-flex h-11 items-center justify-center gap-2
                rounded-md bg-[#cc785c] px-6
                font-mono text-[11px] font-medium uppercase tracking-[0.14em]
                text-white transition-colors
                hover:bg-[#a9583e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]
              "
            >
              <span>Get VaahanSafe</span>
              <VaahanIcon name="arrow-right" size={12} aria-hidden="true" />
            </a>

            <a
              href={`${customerUrl}/activate`}
              className="
                inline-flex h-11 items-center justify-center gap-2
                rounded-md border border-white/[0.2] bg-white/[0.04] px-6
                font-mono text-[11px] font-medium uppercase tracking-[0.14em]
                text-[#fafafa] transition-colors
                hover:bg-white/[0.08] hover:border-white/[0.3]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]
              "
            >
              <span>Activate Retail QR</span>
              <VaahanIcon name="arrow-right" size={12} aria-hidden="true" />
            </a>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 font-mono text-[10px] text-[#71717a]">
            <span>✓ Precision Automotive Substrate</span>
            <span>✓ Scannable By Any Modern Smartphone</span>
            <span>✓ Preserves Driver Forward Visibility</span>
          </div>
        </div>
      </div>
    </section>
  );
}
