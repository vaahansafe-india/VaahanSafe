import * as React from "react";
import { SHIPPING_REPLACEMENT_META } from "../../app/shipping-replacement/shipping-replacement-content";

export function ShippingDocumentMetaView() {
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
            {SHIPPING_REPLACEMENT_META.documentId} • {SHIPPING_REPLACEMENT_META.title}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-muted-foreground/70 dark:text-zinc-500">
          <span>Effective: {SHIPPING_REPLACEMENT_META.effectiveDate}</span>
          <span>•</span>
          <span>Version: {SHIPPING_REPLACEMENT_META.version}</span>
          <span>•</span>
          <span className="text-[#5db8a6]">Republic of India</span>
        </div>
      </div>

      {SHIPPING_REPLACEMENT_META.status === "DRAFT_PENDING_LEGAL_REVIEW" && (
        <div className="mt-4 rounded border border-[#e8a55a]/30 bg-[#fefcf8] p-3 text-[9px] tracking-[0.05em] text-[#b4700e] dark:border-[#e8a55a]/20 dark:bg-[#201d18] dark:text-[#e8a55a]">
          <strong>Notice for Operations & Legal Counsel:</strong> This document reflects the physical fulfillment invariants, carrier coordination protocols, and decal replacement workflows of the VaahanSafe platform. Specific replacement fee tiers and delivery service level agreements require validation by counsel and operations leadership prior to formal publication.
        </div>
      )}
    </div>
  );
}
