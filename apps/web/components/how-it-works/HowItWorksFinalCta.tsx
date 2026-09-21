import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { getActivateUrl, getCustomerUrl } from "@vaahansafe/config";

export function HowItWorksFinalCta() {
  const customerUrl = getCustomerUrl();
  const activateUrl = getActivateUrl();

  return (
    <section
      aria-labelledby="how-it-works-final-cta-heading"
      className="
        relative isolate overflow-hidden
        bg-[#09090b]
        py-20 text-[#fafafa]
        sm:py-24
        lg:py-28
        dark:bg-zinc-950
      "
    >
      <div className="relative mx-auto max-w-[1240px] px-5 text-center sm:px-8 lg:px-10">
        <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#cc785c]">
          Start Your Vehicle Identity
        </span>

        <h2
          id="how-it-works-final-cta-heading"
          className="
            mx-auto mt-4 max-w-[720px] font-serif
            text-3xl font-normal leading-[1.08]
            tracking-[-0.035em]
            text-[#fafafa]
            sm:text-4xl
            lg:text-5xl
          "
        >
          Give your vehicle an identity that matters.
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-[#a1a1aa] sm:text-base">
          Connect your car, motorcycle, or fleet to a scannable safety identity
          designed specifically for Indian roads.
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
            href={activateUrl}
            className="
              inline-flex h-11 items-center justify-center gap-2
              rounded-md border border-white/[0.15] bg-white/[0.04] px-5
              font-mono text-[11px] font-medium uppercase tracking-[0.14em]
              text-[#fafafa] transition-colors
              hover:border-[#cc785c]/40 hover:bg-white/[0.08] hover:text-[#cc785c]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]
            "
          >
            <span>Activate Retail QR</span>
            <VaahanIcon name="arrow-right" size={12} aria-hidden="true" />
          </a>
        </div>

        <p className="mt-8 font-mono text-[9px] uppercase tracking-[0.16em] text-[#71717a]">
          Already bought a retail kit? Use the code under the scratch layer to activate instantly.
        </p>
      </div>
    </section>
  );
}
