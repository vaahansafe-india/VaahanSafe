import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { getCustomerUrl } from "@vaahansafe/config";

export function ReplacementCtaSection() {
  const customerUrl = getCustomerUrl();

  return (
    <section
      aria-labelledby="replacement-cta-heading"
      className="
        border-t border-[#27272a]
        bg-[#09090b]
        py-16 sm:py-20
        text-[#fafafa]
      "
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[760px] text-center">
          <div className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[#cc785c]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
            <span>Ready to Re-link Your Vehicle?</span>
          </div>

          <h2
            id="replacement-cta-heading"
            className="
              mt-4 font-serif text-3xl font-normal leading-tight tracking-[-0.03em]
              sm:text-4xl lg:text-5xl
            "
          >
            Start your replacement request.
          </h2>

          <p className="mx-auto mt-4 max-w-[540px] text-sm leading-relaxed text-[#a1a1aa]">
            Open your private customer portal, select your vehicle, and submit your replacement order. Your existing emergency contacts transfer automatically upon pairing.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href={`${customerUrl}/replacement`}
              className="
                inline-flex h-11 items-center justify-center gap-2
                rounded-md bg-[#cc785c] px-6
                font-mono text-[11px] font-medium uppercase tracking-[0.14em]
                text-white transition-colors
                hover:bg-[#a9583e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]
              "
            >
              <span>Open Customer App</span>
              <VaahanIcon name="arrow-right" size={12} aria-hidden="true" />
            </a>

            <a
              href="mailto:support@vaahansafe.com?subject=QR%20Replacement%20Assistance"
              className="
                inline-flex h-11 items-center justify-center gap-2
                rounded-md border border-white/[0.2] bg-white/[0.04] px-5
                font-mono text-[11px] font-medium uppercase tracking-[0.14em]
                text-[#fafafa] transition-colors
                hover:bg-white/[0.08] hover:border-white/[0.3]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]
              "
            >
              <span>Email Support</span>
              <VaahanIcon name="arrow-right" size={12} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
