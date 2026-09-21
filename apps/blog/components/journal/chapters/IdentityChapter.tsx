import * as React from "react";
import Link from "next/link";
import type { BlogPost } from "@vaahansafe/content";
import { resolveArticleMedia } from "@vaahansafe/content";
import { EditorialMedia } from "../media/EditorialMedia";

interface IdentityChapterProps {
  article?: BlogPost;
}

export function IdentityChapter({ article }: IdentityChapterProps = {}) {
  const media = article ? resolveArticleMedia(article, "HERO") : undefined;
  const steps = [
    {
      title: "PHYSICAL VEHICLE",
      subtitle: "Hardware asset on the roadway",
      nodeColor: "bg-[#cc785c]",
    },
    {
      title: "QR IDENTITY",
      subtitle: "Opaque, non-sequential token",
      nodeColor: "bg-[#5db8a6]",
    },
    {
      title: "PUBLIC RESOLVER",
      subtitle: "Authenticated cloud proxy",
      nodeColor: "bg-[#e8a55a]",
    },
    {
      title: "SAFETY PROJECTION",
      subtitle: "Dynamic zero-exposure DOM",
      nodeColor: "bg-[#5db872]",
    },
    {
      title: "USEFUL CONNECTION",
      subtitle: "Masked VoIP & emergency alerts",
      nodeColor: "bg-[#cc785c]",
    },
  ];

  return (
    <section
      aria-labelledby="dark-chapter-heading"
      className="w-full border-b border-[#2e2b27] bg-[#181715] py-20 sm:py-28 lg:py-32 text-[#faf9f5]"
    >
      <div className="w-full px-4 sm:px-6 md:px-10 lg:px-14 xl:px-20 2xl:px-28">
        {/* Chapter Micro-Label */}
        <div className="mb-10 flex items-center justify-between border-b border-[#2e2b27] pb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-[#8e8b82]">
          <span className="text-[#cc785c]">FIELD NOTE / 04 &bull; QR IDENTITY</span>
          <span>ZERO-EXPOSURE TELEPHONY ARCHITECTURE</span>
        </div>

        {/* 12-Column Grid: Statement & Macro Visual */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 items-center">
          {/* Left Large Statement (7 cols) */}
          <div className="space-y-6 lg:col-span-7">
            <h2
              id="dark-chapter-heading"
              className="
                font-serif
                text-3xl sm:text-4xl md:text-5xl lg:text-[3.75rem]
                font-normal
                leading-[1.02]
                tracking-[-0.03em]
                text-[#faf9f5]
              "
            >
              A QR can be public. <br className="hidden sm:inline" />
              Your private identity <br className="hidden sm:inline" />
              <span className="text-[#a09d96]">doesn&apos;t have to be.</span>
            </h2>

            <p className="max-w-xl font-sans text-sm sm:text-base leading-relaxed text-[#a09d96]">
              Encoding raw mobile numbers, residential addresses, or blood groups directly into static QR stickers permanently compromises driver privacy. If your phone number changes or your vehicle is transferred, static code becomes perpetual exposure.
            </p>

            <p className="max-w-xl font-sans text-xs sm:text-sm leading-relaxed text-[#8e8b82]">
              VaahanSafe resolves an opaque cryptographic public identifier through an authenticated telephony relay—enabling immediate roadside emergency response without exposing a single private record to bystander viewfinders.
            </p>

            {article && (
              <div className="pt-4 border-t border-[#2e2b27] space-y-1">
                <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#cc785c]">
                  FIELD NOTE / {article.category}
                </div>
                <Link
                  href={`/articles/${article.slug}`}
                  className="group inline-flex items-center gap-2 font-serif text-lg text-[#faf9f5] hover:text-[#cc785c] transition-colors"
                >
                  <span>{article.title}</span>
                  <span className="inline-block transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">
                    &rarr;
                  </span>
                </Link>
              </div>
            )}

            <div className="pt-2">
              <Link
                href="/category/qr-identity"
                className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#faf9f5] transition-colors hover:text-[#cc785c]"
              >
                <span>Explore QR &amp; Identity Architecture</span>
                <span
                  className="inline-block transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  ↗
                </span>
              </Link>
            </div>
          </div>

          {/* Right: Macro Visual of Decal on Windshield (5 cols) */}
          <div className="lg:col-span-5">
            <EditorialMedia
              src={media?.src}
              alt={media?.alt || article?.title || "Optical placement of VaahanSafe decal on automotive glass"}
              frame="DARK_FIELD"
              aspectRatio="4/3"
              caption={media?.caption || `FIG. 04 / ${article ? article.title.toUpperCase() : "MACRO GLAZING DECAL BONDING"} • ZERO EXPOSURE`}
              category={article?.category || "QR & IDENTITY"}
              indexNumber="04"
              focalPoint={media?.focalPoint}
              role="HERO"
              sizes="(min-width: 1024px) 42vw, 100vw"
            />
          </div>
        </div>

        {/* Signature Full-Width Identity Grammar Diagram */}
        <div className="mt-16 sm:mt-24 pt-12 sm:pt-16 border-t border-[#2e2b27]">
          <div className="mb-6 font-mono text-[9px] uppercase tracking-[0.24em] text-[#8e8b82]">
            AUTHORITATIVE IDENTITY PIPELINE
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {steps.map((step, idx) => {
              const isLast = idx === steps.length - 1;

              return (
                <div key={step.title} className="relative flex flex-col justify-between space-y-3">
                  {/* Step Connector Line & Node */}
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ring-4 ring-[#181715] ${step.nodeColor}`} />
                    {!isLast && (
                      <span className="hidden sm:block h-px flex-1 bg-[#2e2b27]" />
                    )}
                  </div>

                  {/* Step Text */}
                  <div className="space-y-1">
                    <div className="font-mono text-xs uppercase tracking-wider text-[#faf9f5]">
                      {step.title}
                    </div>
                    <div className="font-sans text-[11px] text-[#8e8b82] leading-snug">
                      {step.subtitle}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
