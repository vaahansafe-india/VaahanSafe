import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function EmergencyActionStation() {
  return (
    <div className="my-12 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#09090b] p-8 text-[#fafafa] sm:p-12">
      <div className="max-w-[680px]">
        <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.22em] text-[#cc785c]">
          In an Emergency
        </span>

        <h2 className="mt-3 font-serif text-2xl font-normal leading-tight tracking-[-0.02em] text-[#fafafa] sm:text-3xl lg:text-4xl">
          Use the appropriate emergency services.
        </h2>

        <p className="mt-4 text-xs leading-relaxed text-[#e4e4e7] sm:text-sm sm:leading-7">
          VaahanSafe is designed to provide auxiliary context and notify family or fleet managers,
          but it should never delay contacting qualified emergency responders when urgent assistance
          is required.
        </p>

        <div className="mt-6 rounded-xl border border-white/[0.08] bg-[#18181b] p-4 sm:p-5">
          <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.14em] text-[#e8a55a]">
            <VaahanIcon name="shield" size={12} className="text-[#e8a55a]" />
            <span>Emergency Authorities Priority</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#a1a1aa]">
            In the event of a road traffic accident or acute medical trauma, bystanders must dial
            National Emergency Services immediately. Digital safety identities should only be reviewed
            once life safety measures and emergency dispatches are underway.
          </p>
        </div>
      </div>
    </div>
  );
}
