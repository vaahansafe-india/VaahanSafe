import * as React from "react";
import { TERMS_META } from "../../app/terms/terms-content";

export function TermsDocumentMetaView() {
  return (
    <div
      className="
        my-12 border-t border-border pt-8
        font-mono text-[8px] uppercase tracking-[0.16em]
        text-muted-foreground
        dark:border-white/[0.08] dark:text-zinc-500
      "
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
          <span>
            {TERMS_META.documentId} • {TERMS_META.title}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-muted-foreground/70 dark:text-zinc-500">
          <span>Effective: {TERMS_META.effectiveDate}</span>
          <span>•</span>
          <span>Version: {TERMS_META.version}</span>
          <span>•</span>
          <span className="text-[#5db8a6]">Republic of India</span>
        </div>
      </div>

      {TERMS_META.status === "DRAFT_PENDING_LEGAL_REVIEW" && (
        <div className="mt-4 rounded border border-[#e8a55a]/30 bg-[#fefcf8] p-3 text-[9px] tracking-[0.05em] text-[#b4700e] dark:border-[#e8a55a]/20 dark:bg-[#201d18] dark:text-[#e8a55a]">
          <strong>Notice for Legal & Compliance Review:</strong> This document represents the functional vehicle-identity architecture, service responsibilities, and operational invariants of the VaahanSafe platform. Specific statutory clauses, liability limits, and dispute arbitration venues require formal validation by qualified legal counsel prior to final regulatory deposition.
        </div>
      )}
    </div>
  );
}
