import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";

export function UserProvidedAdvisoryCard() {
  return (
    <section
      aria-labelledby="user-provided-heading"
      className="
        relative isolate overflow-hidden
        border-b border-border
        bg-background
        py-16
        sm:py-20
        lg:py-24
        dark:border-border
        dark:bg-zinc-950
      "
    >
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="rounded-2xl border border-[#e8a55a]/40 bg-[#fefcf8] p-8 dark:border-[#e8a55a]/30 dark:bg-zinc-900 sm:p-12">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#e8a55a]">
            <VaahanIcon name="activity" size={13} aria-hidden="true" />
            <span>07 / Medical &amp; Accuracy Advisory</span>
          </div>

          <h2
            id="user-provided-heading"
            className="
              mt-3 font-serif
              text-2xl font-normal leading-[1.1]
              tracking-[-0.03em]
              text-foreground
              sm:text-3xl
              lg:text-4xl
              dark:text-zinc-50
            "
          >
            Safety information is user-provided.
          </h2>

          <p className="mt-4 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm sm:leading-7 dark:text-zinc-400">
            Any blood group, medical note, or emergency contact displayed through a
            VaahanSafe public view is supplied and maintained by the user. While highly
            valuable for emergency context, it should never be treated as independently
            verified clinical diagnosis or hospital certification.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Link
              href="/safety-disclaimer"
              className="
                inline-flex items-center gap-2 font-mono text-[11px]
                font-medium uppercase tracking-[0.14em] text-[#cc785c]
                hover:text-[#a9583e]
              "
            >
              <span>Read Full Safety Disclaimer</span>
              <VaahanIcon name="arrow-right" size={12} aria-hidden="true" />
            </Link>

            <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
              In life-threatening situations, always dial 112 / 100 / 108 first
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
