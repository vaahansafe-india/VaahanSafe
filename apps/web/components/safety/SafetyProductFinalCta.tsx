import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { getCustomerUrl } from "@vaahansafe/config";

export function SafetyProductFinalCta() {
  const customerUrl = getCustomerUrl();

  return (
    <section
      aria-labelledby="safety-final-cta-heading"
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
        <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#5db8a6]">
          Privacy by Choice
        </span>

        <h2
          id="safety-final-cta-heading"
          className="
            mx-auto mt-4 max-w-[720px] font-serif
            text-3xl font-normal leading-[1.08]
            tracking-[-0.035em]
            text-[#fafafa]
            sm:text-4xl
            lg:text-5xl
          "
        >
          Your vehicle identity.
          <br />
          Your information choices.
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-[#a1a1aa] sm:text-base">
          Experience road safety with peace of mind. Give your vehicle a smart identity
          without ever compromising personal privacy.
        </p>

        <div className="mt-10 flex justify-center">
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
        </div>
      </div>
    </section>
  );
}
