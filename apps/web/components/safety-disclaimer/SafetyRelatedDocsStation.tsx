import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";

const LEGAL_DOCUMENTS = [
  {
    index: "01",
    title: "Privacy Policy",
    href: "/privacy",
    description: "Learn how data is controlled across private and public surfaces",
  },
  {
    index: "02",
    title: "Terms of Service",
    href: "/terms",
    description: "Understand the terms governing accounts, identities, and plans",
  },
  {
    index: "03",
    title: "Refund Policy",
    href: "/refund-policy",
    description: "Commercial purchase terms and order issue review procedures",
  },
  {
    index: "04",
    title: "Shipping & Replacement",
    href: "/shipping-replacement",
    description: "Physical decal logistics and hardware replacement lifecycles",
  },
] as const;

export function SafetyRelatedDocsStation() {
  return (
    <section
      aria-labelledby="related-legal-heading"
      className="my-16 overflow-hidden rounded-[24px] border border-border bg-muted p-8 sm:p-12 dark:border-white/[0.08] dark:bg-zinc-900"
    >
      <div className="flex items-center gap-3">
        <span className="font-mono text-[8px] font-medium uppercase tracking-[0.2em] text-[#cc785c]">
          Related Legal Architecture
        </span>
        <span className="h-px w-8 bg-[#cc785c]/40" />
      </div>

      <div className="mt-6">
        <h2
          id="related-legal-heading"
          className="font-serif text-2xl font-normal tracking-[-0.03em] text-foreground sm:text-3xl dark:text-zinc-50"
        >
          Explore the complete VaahanSafe legal system.
        </h2>

        <p className="mt-2 max-w-[600px] text-xs leading-relaxed text-muted-foreground sm:text-sm sm:leading-7 dark:text-zinc-400">
          Our documentation is organized into five coordinated pillars that establish clear boundaries between software identities, user data controls, and emergency protocols.
        </p>

        {/* Document Grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {LEGAL_DOCUMENTS.map((doc) => (
            <Link
              key={doc.index}
              href={doc.href}
              className="
                group flex flex-col justify-between
                rounded-xl border border-border
                bg-background p-5 transition-colors
                hover:border-[#cc785c]
                dark:border-white/[0.06] dark:bg-zinc-950
              "
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[8px] font-semibold text-[#cc785c]">
                    DOCUMENT / {doc.index}
                  </span>
                  <VaahanIcon
                    name="arrow-right"
                    size={12}
                    className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-[#cc785c] dark:text-zinc-500"
                  />
                </div>
                <h3 className="mt-2 font-mono text-sm font-semibold text-foreground group-hover:text-[#cc785c] dark:text-zinc-50">
                  {doc.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground dark:text-zinc-400">
                  {doc.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Support Link */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 dark:border-white/[0.08]">
          <div className="text-xs text-muted-foreground dark:text-zinc-400">
            Questions about VaahanSafe safety features or legal boundaries?
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/#faq"
              className="
                inline-flex h-9 items-center gap-1.5
                rounded-md border border-border
                bg-background px-4 font-mono text-[9px] font-semibold
                uppercase tracking-[0.14em] text-foreground
                hover:border-[#cc785c] hover:text-[#cc785c]
                dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50
              "
            >
              <span>Visit Help Center</span>
              <VaahanIcon name="arrow-right" size={10} />
            </Link>

            <a
              href="mailto:support@vaahansafe.com?subject=Safety%20Disclaimer%20Inquiry%20-%20VaahanSafe"
              className="
                inline-flex h-9 items-center gap-1.5
                rounded-md bg-[#cc785c] px-4
                font-mono text-[9px] font-semibold
                uppercase tracking-[0.14em] text-white
                hover:bg-[#a9583e]
              "
            >
              <span>Contact VaahanSafe</span>
              <VaahanIcon name="arrow-right" size={10} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
