import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { getCustomerUrl } from "@vaahansafe/config";

export function PlansFinalCta() {
  const customerUrl = getCustomerUrl();

  return (
    <section
      aria-labelledby="plans-final-cta-heading"
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
            <span>Identity First Architecture</span>
          </div>

          <h2
            id="plans-final-cta-heading"
            className="
              mt-6 font-serif
              text-3xl font-normal leading-tight tracking-[-0.03em]
              sm:text-4xl lg:text-5xl
            "
          >
            Start with the identity. <br className="hidden sm:block" />
            <span className="text-[#cc785c]">
              Choose the services around it.
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-[560px] text-sm leading-relaxed text-[#a1a1aa] sm:text-base">
            Equip your car or two-wheeler with an active VaahanSafe safety decal. Manage your privacy, update contacts, and select the protection tier that fits your journey.
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
            <span>✓ No App Required For Scanners</span>
            <span>✓ Decal Bundled With Identity</span>
            <span>✓ Cancel or Switch Tiers Anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
}
