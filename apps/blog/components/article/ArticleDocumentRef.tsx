import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { getWebUrl } from "@vaahansafe/config";

interface ArticleDocumentRefProps {
  documentRef?: {
    title: string;
    href: string;
  };
}

export function ArticleDocumentRef({ documentRef }: ArticleDocumentRefProps) {
  const webUrl = getWebUrl();

  return (
    <div className="space-y-6 my-10 font-sans">
      {/* Official Guide / Document Link */}
      {documentRef && (
        <div className="rounded-2xl border border-[#e6dfd8] bg-[#f5f0e8]/60 p-5 sm:p-6 dark:border-[#2e2b27] dark:bg-[#1f1e1b]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#8e8b82]">
              OFFICIAL PRODUCT SPECIFICATION
            </div>
            <div className="font-serif text-lg text-[#141413] dark:text-[#faf9f5]">
              {documentRef.title}
            </div>
            <p className="text-xs text-[#6c6a64] dark:text-[#a09d96]">
              Canonical reference guidelines and regulatory specifications under VaahanSafe Documents.
            </p>
          </div>

          <a
            href={`${webUrl}${documentRef.href}`}
            className="
              inline-flex items-center gap-1.5 shrink-0
              font-mono text-xs font-semibold uppercase tracking-wider
              text-[#cc785c] hover:text-[#a9583e] transition-colors
            "
          >
            <span>Open Reference</span>
            <VaahanIcon name="external-link" size={12} aria-hidden="true" />
          </a>
        </div>
      )}

      {/* Restrained About VaahanSafe Card */}
      <div className="rounded-3xl border border-[#cc785c]/25 bg-gradient-to-br from-[#cc785c]/5 via-transparent to-transparent p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 dark:border-[#cc785c]/20">
        <div className="space-y-1.5 max-w-md">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c] font-semibold">
            ABOUT VAAHANSAFE
          </div>
          <h4 className="font-serif text-xl font-normal text-[#141413] dark:text-[#faf9f5]">
            Learn how the vehicle safety identity works.
          </h4>
          <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
            Industrial UV-cured optical decals connecting bystanders directly to your emergency contacts without exposing private phone numbers or home addresses.
          </p>
        </div>

        <a
          href={`${webUrl}/#what-is-vaahansafe`}
          className="
            inline-flex h-10 items-center justify-center gap-2
            rounded-xl bg-[#cc785c] px-5 shrink-0 self-start sm:self-center
            font-mono text-xs font-semibold uppercase tracking-wider
            text-white transition-all hover:bg-[#a9583e]
          "
        >
          <span>Explore VaahanSafe</span>
          <span aria-hidden="true">&rarr;</span>
        </a>
      </div>
    </div>
  );
}
