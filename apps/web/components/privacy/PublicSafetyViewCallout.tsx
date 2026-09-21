import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function PublicSafetyViewCallout() {
  return (
    <div
      className="
        my-12 overflow-hidden
        rounded-[20px]
        border border-white/[0.08]
        bg-[#09090b]
        p-6 sm:p-8
        text-[#fafafa]
        shadow-md
      "
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
          <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-[#cc785c]">
            Signature Architectural Invariant
          </span>
        </div>

        <span className="font-mono text-[6px] tracking-[0.14em] text-[#71717a]">
          REF / SAFETY-VIEW-SEPARATION
        </span>
      </div>

      <h3 className="mt-4 font-serif text-2xl font-normal tracking-[-0.02em] sm:text-3xl">
        The public safety view is not your account.
      </h3>

      <p className="mt-3 max-w-[620px] text-xs leading-relaxed text-[#a1a1aa] sm:text-[13px] sm:leading-7">
        When a VaahanSafe QR is scanned, the public experience is designed around the supported
        information you have chosen to make available for that vehicle. A scan connects a responder
        to your vehicle safety view—it does not provide access to your private profile, address, or
        billing history.
      </p>

      {/* 3-Tier Visual Flow */}
      <div className="mt-8 grid gap-4 border-t border-white/[0.08] pt-6 sm:grid-cols-3">
        {/* Step 1 */}
        <div className="rounded-xl border border-white/[0.06] bg-[#18181b] p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[6px] tracking-[0.14em] text-muted-foreground">
              STEP 01
            </span>
            <span className="font-mono text-[7px] uppercase text-muted-foreground">
              Private
            </span>
          </div>
          <h4 className="mt-2 text-xs font-medium text-[#f4f4f5]">
            Private Account
          </h4>
          <ul className="mt-3 space-y-1.5 text-[11px] text-[#71717a]">
            <li>• Residential address</li>
            <li>• Account email & passwords</li>
            <li>• Transaction details</li>
          </ul>
        </div>

        {/* Step 2 */}
        <div className="rounded-xl border border-[#cc785c]/30 bg-[#18181b] p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[6px] tracking-[0.14em] text-[#cc785c]">
              STEP 02
            </span>
            <span className="font-mono text-[7px] uppercase text-[#cc785c]">
              Control
            </span>
          </div>
          <h4 className="mt-2 text-xs font-medium text-[#fafafa]">
            Owner Control
          </h4>
          <ul className="mt-3 space-y-1.5 text-[11px] text-[#e4e4e7]">
            <li>• Toggle emergency relays</li>
            <li>• Optional blood group</li>
            <li>• Emergency medical notes</li>
          </ul>
        </div>

        {/* Step 3 */}
        <div className="rounded-xl border border-[#5db8a6]/30 bg-[#162220] p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[6px] tracking-[0.14em] text-[#5db8a6]">
              STEP 03
            </span>
            <span className="font-mono text-[7px] uppercase text-[#5db8a6]">
              Public
            </span>
          </div>
          <h4 className="mt-2 text-xs font-medium text-[#fafafa]">
            Selected Safety View
          </h4>
          <ul className="mt-3 space-y-1.5 text-[11px] text-[#a0cfc4]">
            <li>• Only selected details</li>
            <li>• Masked contact relay</li>
            <li>• Zero-login access for finder</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-white/[0.08] pt-4 text-[11px] text-muted-foreground">
        <span>Visibility choices may be updated through the applicable VaahanSafe account controls.</span>
        <VaahanIcon name="shield" size={12} className="text-[#cc785c]" aria-hidden="true" />
      </div>
    </div>
  );
}
