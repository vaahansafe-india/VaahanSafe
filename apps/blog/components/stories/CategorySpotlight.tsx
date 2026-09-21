import * as React from "react";
import Link from "next/link";
import { BlogPost } from "@vaahansafe/content";
import { VaahanIcon } from "@vaahansafe/icons";

interface CategorySpotlightProps {
  privacyArticle?: BlogPost;
}

export function CategorySpotlight({ privacyArticle }: CategorySpotlightProps) {
  return (
    <section aria-labelledby="privacy-spotlight-heading" className="py-12 sm:py-16 border-b border-[#e6dfd8] dark:border-[#2e2b27]">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="rounded-3xl border border-[#e6dfd8] bg-gradient-to-br from-[#efe9de]/80 via-[#faf9f5] to-[#f5f0e8] p-8 sm:p-12 lg:p-14 dark:border-[#2e2b27] dark:from-[#252320] dark:via-[#181715] dark:to-[#1f1e1b]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Narrative (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[#5db8a6]">
                <VaahanIcon name="shield" size={14} />
                <span>CATEGORY SPOTLIGHT &bull; PRIVACY &amp; DPDP</span>
              </div>

              <h2
                id="privacy-spotlight-heading"
                className="
                  font-serif
                  text-3xl sm:text-4xl lg:text-[2.75rem]
                  font-normal
                  leading-[1.12]
                  tracking-[-0.02em]
                  text-[#141413]
                  dark:text-[#faf9f5]
                "
              >
                Private account. <br />
                <span className="text-[#5db8a6]">Controlled public information.</span>
              </h2>

              <p className="text-sm sm:text-base leading-relaxed text-[#6c6a64] dark:text-[#a09d96] max-w-xl font-sans">
                VaahanSafe implements zero-exposure contact routing under the Digital Personal Data Protection (DPDP) Act 2023. When a passerby scans your decal, our masked virtual DID bridges communication directly to your designated emergency contacts without broadcasting residential records or phone numbers.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/category/privacy"
                  className="
                    inline-flex h-10 items-center justify-center gap-2
                    rounded-xl bg-[#5db8a6] px-5
                    font-mono text-xs font-semibold uppercase tracking-wider
                    text-white transition-all hover:bg-[#4ea291]
                  "
                >
                  <span>Explore Privacy Articles</span>
                  <span aria-hidden="true">&rarr;</span>
                </Link>

                {privacyArticle && (
                  <Link
                    href={`/articles/${privacyArticle.slug}`}
                    className="font-mono text-xs text-[#6c6a64] hover:text-[#141413] dark:text-[#a09d96] dark:hover:text-[#faf9f5] underline"
                  >
                    Read latest: {privacyArticle.title.slice(0, 45)}...
                  </Link>
                )}
              </div>
            </div>

            {/* Right Editorial Boundary Diagram (5 cols) */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-[#e6dfd8] bg-[#faf9f5] p-6 sm:p-7 shadow-xs dark:border-[#2e2b27] dark:bg-[#1f1e1b] space-y-4">
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#8e8b82]">
                  3-TIER DATA MINIMIZATION
                </div>

                <div className="space-y-3 font-mono text-xs">
                  {/* Tier 1 */}
                  <div className="rounded-xl border border-[#e6dfd8] p-3.5 bg-[#f5f0e8]/50 dark:border-[#2e2b27] dark:bg-[#181715]/40 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#cc785c]">01 PRIVATE ACCOUNT</span>
                      <span className="text-[#8e8b82]">ENCRYPTED / SECURE RELAY</span>
                    </div>
                    <p className="text-[11px] text-[#6c6a64] dark:text-[#a09d96] font-sans">
                      Billing address, payment instruments, session tokens, login mobile.
                    </p>
                  </div>

                  {/* Tier 2 */}
                  <div className="rounded-xl border border-[#e6dfd8] p-3.5 bg-[#f5f0e8]/50 dark:border-[#2e2b27] dark:bg-[#181715]/40 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#5db8a6]">02 OWNER CONTROLS</span>
                      <span className="text-[#8e8b82]">TOGGLE GATE</span>
                    </div>
                    <p className="text-[11px] text-[#6c6a64] dark:text-[#a09d96] font-sans">
                      Medical notes consent, vehicle make visibility, priority contact order.
                    </p>
                  </div>

                  {/* Tier 3 */}
                  <div className="rounded-xl border border-[#5db8a6]/40 p-3.5 bg-[#5db8a6]/10 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#5db8a6]">03 PUBLIC SAFETY VIEW</span>
                      <span className="text-[#5db8a6]">ZERO EXPOSURE</span>
                    </div>
                    <p className="text-[11px] text-[#3d3d3a] dark:text-[#faf9f5] font-sans">
                      Masked VoIP call button, vehicle verify badge, consented trauma flags.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
