import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function SafetyDisclaimerNotice() {
  return (
    <div className="my-8 overflow-hidden rounded-xl border border-[#e8a55a]/40 bg-[#fefcf8] p-6 text-foreground sm:p-8 dark:border-[#e8a55a]/25 dark:bg-[#1f1c16] dark:text-zinc-50">
      <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.2em] text-[#b4700e] dark:text-[#e8a55a]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#e8a55a]" />
        <span>Essential Safety Notice</span>
      </div>

      <h3 className="mt-3 font-serif text-xl font-normal text-foreground sm:text-2xl dark:text-zinc-50">
        VaahanSafe supports connection. It does not replace emergency services.
      </h3>

      <p className="mt-2 text-xs leading-relaxed text-[#5c5446] sm:text-sm sm:leading-7 dark:text-[#d5cfc4]">
        VaahanSafe is designed to facilitate civilian roadside communication and relay emergency contacts. It is not an emergency response service, police dispatcher, ambulance provider, or medical hotline.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-[#e8a55a]/20 bg-white/70 p-3.5 dark:border-white/[0.06] dark:bg-zinc-950/60">
          <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#b4700e] dark:text-[#e8a55a]">
            In Immediate Danger
          </span>
          <p className="mt-1 text-xs text-[#5c5446] dark:text-[#d5cfc4]">
            Always dial National Emergency Authorities (112 / 100 / 108) first before scanning any QR.
          </p>
        </div>

        <div className="rounded-lg border border-[#e8a55a]/20 bg-white/70 p-3.5 dark:border-white/[0.06] dark:bg-zinc-950/60">
          <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#b4700e] dark:text-[#e8a55a]">
            Communication Relays
          </span>
          <p className="mt-1 text-xs text-[#5c5446] dark:text-[#d5cfc4]">
            Relay calls and SMS notifications depend on third-party telecom carrier availability.
          </p>
        </div>

        <div className="rounded-lg border border-[#e8a55a]/20 bg-white/70 p-3.5 dark:border-white/[0.06] dark:bg-zinc-950/60">
          <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#b4700e] dark:text-[#e8a55a]">
            User-Supplied Data
          </span>
          <p className="mt-1 text-xs text-[#5c5446] dark:text-[#d5cfc4]">
            Medical notes and emergency contacts are entered directly by the vehicle owner.
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 border-t border-[#e8a55a]/20 pt-4 text-xs text-[#8a6d3b] dark:text-[#a89574]">
        <VaahanIcon name="shield" size={12} className="text-[#e8a55a]" />
        <span>For detailed protocols, review our comprehensive Safety Disclaimer guidelines.</span>
      </div>
    </div>
  );
}
