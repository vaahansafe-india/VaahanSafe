import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function ActivationPrivacyCard() {
  return (
    <div
      className="
        my-10 rounded-[18px]
        border border-border
        bg-background p-6 sm:p-7
        dark:border-white/[0.08]
        dark:bg-zinc-950
      "
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-[#cc785c]">
          Ownership & Activation Architecture
        </span>
        <span className="font-mono text-[6px] tracking-[0.14em] text-muted-foreground dark:text-zinc-500">
          PUBLIC QR ≠ ACTIVATION PROOF
        </span>
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
        {/* Public QR */}
        <div className="rounded-xl border border-border bg-white p-4 dark:border-white/[0.06] dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-[#cc785c]/10 text-[#cc785c]">
              <VaahanIcon name="qr" size={12} aria-hidden="true" />
            </span>
            <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-foreground dark:text-zinc-50">
              Public QR Identifier
            </span>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-muted-foreground">
            Physically printed on the reflective decal. Serves only to route scanners to your configured safety view. It contains zero private account details and cannot be used to modify ownership.
          </p>
        </div>

        {/* Not Equal Symbol */}
        <div className="flex items-center justify-center text-center">
          <span className="font-mono text-xl font-light text-[#cc785c]">≠</span>
        </div>

        {/* Concealed Activation Proof */}
        <div className="rounded-xl border border-border bg-white p-4 dark:border-white/[0.06] dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-[#5db8a6]/15 text-[#5db8a6]">
              <VaahanIcon name="lock" size={12} aria-hidden="true" />
            </span>
            <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-foreground dark:text-zinc-50">
              Concealed Activation Proof
            </span>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-muted-foreground">
            Separated under a tamper-evident scratch layer or secure digital order token. Required exclusively during initial setup to claim vehicle identity. Once linked, it cannot be reused.
          </p>
        </div>
      </div>

      <p className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-[#71717a] dark:border-white/[0.06] dark:text-zinc-400">
        This architectural separation ensures that even if an unauthorized bystander photographs your vehicle sticker, they cannot alter your emergency contacts, hijack your subscription, or access your customer account.
      </p>
    </div>
  );
}
