import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function PrimaryDisclaimerCallout() {
  return (
    <div className="my-8 overflow-hidden rounded-xl border border-white/[0.08] bg-[#09090b] p-6 text-[#fafafa] sm:p-8">
      <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.2em] text-[#cc785c]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
        <span>Core Functional Boundary</span>
      </div>

      <h3 className="mt-3 font-serif text-xl font-normal tracking-[-0.02em] text-[#fafafa] sm:text-2xl">
        VaahanSafe is a connection tool, not an emergency response service.
      </h3>

      <p className="mt-3 text-xs leading-relaxed text-[#a1a1aa] sm:text-sm sm:leading-7">
        VaahanSafe is engineered to bridge civilian awareness by displaying owner-configured vehicle context and initiating civilian relay calls. It does not dispatch police squads, deploy paramedic ambulances, direct fire rescue units, or provide clinical triage.
      </p>

      <div className="mt-6 rounded-lg border border-white/[0.08] bg-[#18181b] p-4 text-xs text-[#fafafa]">
        <div className="flex items-center gap-2 font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#e8a55a]">
          <VaahanIcon name="shield" size={12} className="text-[#e8a55a]" />
          <span>Immediate Danger Directive</span>
        </div>
        <p className="mt-2 text-[#a1a1aa]">
          In an active motor vehicle crash, personal injury event, or immediate threat to human life, bystanders and responders must dial the appropriate national emergency authorities directly before interacting with any digital platform.
        </p>
      </div>
    </div>
  );
}
