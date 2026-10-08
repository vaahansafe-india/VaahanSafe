import * as React from "react";
import { getWebUrl } from "@vaahansafe/config";

interface ArticleDocumentRefProps {
  documentRef?: {
    title: string;
    href: string;
  };
}

export function ArticleDocumentRef({ documentRef: _documentRef }: ArticleDocumentRefProps = {}) {
  const webUrl = getWebUrl();

  return (
    <div className="my-10 font-sans">

      {/* Restrained About VaahanSafe Card */}
      <div className="rounded-sm border border-[var(--journal-line)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-md">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c] font-semibold">
            ABOUT VAAHANSAFE
          </div>
          <h2 className="font-serif text-2xl font-medium">
            Learn how the vehicle safety identity works.
          </h2>
          <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
            Discover how a QR connects a vehicle to the safety information its
            owner chooses to make available.
          </p>
        </div>

        <a
          href={`${webUrl}/#what-is-vaahansafe`}
          className="journal-button journal-button-primary shrink-0 self-start sm:self-center"
        >
          <span>Explore VaahanSafe</span>
          <span aria-hidden="true">&rarr;</span>
        </a>
      </div>
    </div>
  );
}
