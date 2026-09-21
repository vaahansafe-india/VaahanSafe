import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function ActivationTermsCallout() {
  return (
    <div className="my-8 overflow-hidden rounded-xl border border-border bg-background p-6 sm:p-8 dark:border-white/[0.08] dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.2em] text-[#cc785c]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
          <span>Activation Architecture</span>
        </div>

        <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#e8a55a]">
          PUBLIC QR ≠ ACTIVATION PROOF
        </span>
      </div>

      <h3 className="mt-3 font-serif text-xl font-normal text-foreground sm:text-2xl dark:text-zinc-50">
        Two acquisition channels. One VaahanSafe QR identity system.
      </h3>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm sm:leading-7 dark:text-zinc-400">
        Whether a physical decal is ordered online or acquired from an authorized retail store, activation requires ownership verification.
      </p>

      {/* Dual Channel Progression */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {/* Online Channel */}
        <div className="rounded-lg border border-border bg-muted/50 p-4 dark:border-white/[0.06] dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.16em] text-[#cc785c]">
              Channel 01
            </span>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground dark:text-zinc-50">
              Online Direct Order
            </span>
          </div>

          <div className="mt-4 space-y-2 text-xs text-[#3f3f46] dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[8px] text-muted-foreground/70">01</span>
              <span>Account registration & mobile verification</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[8px] text-muted-foreground/70">02</span>
              <span>Vehicle details entry during checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[8px] text-muted-foreground/70">03</span>
              <span>Decal assigned & paired to vehicle record</span>
            </div>
            <div className="flex items-center gap-2 text-[#5db8a6]">
              <span className="font-mono text-[8px] font-semibold">04</span>
              <span className="font-medium">Direct activation on delivery confirmation</span>
            </div>
          </div>
        </div>

        {/* Retail Channel */}
        <div className="rounded-lg border border-border bg-muted/50 p-4 dark:border-white/[0.06] dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.16em] text-[#cc785c]">
              Channel 02
            </span>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground dark:text-zinc-50">
              Authorized Retail Pack
            </span>
          </div>

          <div className="mt-4 space-y-2 text-xs text-[#3f3f46] dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[8px] text-muted-foreground/70">01</span>
              <span>Unpack retail kit and scan public QR</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[8px] text-muted-foreground/70">02</span>
              <span>Reveal concealed one-time activation credential</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[8px] text-muted-foreground/70">03</span>
              <span>Authenticate account & connect vehicle record</span>
            </div>
            <div className="flex items-center gap-2 text-[#5db8a6]">
              <span className="font-mono text-[8px] font-semibold">04</span>
              <span className="font-medium">Active identity deployed to safety resolver</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-[#e8a55a]/30 bg-[#fefcf8] p-3 text-xs leading-relaxed text-[#b4700e] dark:border-[#e8a55a]/20 dark:bg-[#201d18] dark:text-[#e8a55a]">
        <strong>Legal Principle:</strong> Merely scanning or possessing a physical sticker does not establish ownership or the legal right to claim the vehicle identity. Unauthorized activation attempts are prohibited and logged for account protection.
      </div>
    </div>
  );
}
