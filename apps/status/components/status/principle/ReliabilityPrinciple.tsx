import * as React from "react";

export function ReliabilityPrinciple() {
  return (
    <section
      aria-label="VaahanSafe Reliability Principle"
      className="w-full rounded-3xl bg-[#141413] text-[#faf9f5] p-5 sm:p-10 lg:p-16 my-6 sm:my-8 space-y-8 sm:space-y-10 antialiased"
    >
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[#cc785c] font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
          <span>RELIABILITY / PRINCIPLE</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] font-normal leading-[1.12] tracking-tight">
          Status should tell you what is affected, not bury it in infrastructure.
        </h2>
        <p className="font-sans text-xs sm:text-sm text-[#a09d96] leading-relaxed max-w-2xl">
          When vehicle owners and first responders interact with VaahanSafe, they rely on specific public capabilities. We communicate service health across the customer journey rather than listing internal databases or servers.
        </p>
      </div>

      {/* 4-Step Operational Model Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-[#2e2b27]">
        <div className="space-y-1.5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[#cc785c]">
            01 &bull; SERVICE
          </div>
          <div className="font-serif text-base text-[#faf9f5]">
            Customer Capability
          </div>
          <p className="font-sans text-xs text-[#77736d] leading-relaxed">
            Identifies the specific step of the journey experiencing disruption.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[#cc785c]">
            02 &bull; CONDITION
          </div>
          <div className="font-serif text-base text-[#faf9f5]">
            Factual State
          </div>
          <p className="font-sans text-xs text-[#77736d] leading-relaxed">
            Operational, degraded, or outage based on verified health evaluation.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[#cc785c]">
            03 &bull; IMPACT
          </div>
          <div className="font-serif text-base text-[#faf9f5]">
            Human Context
          </div>
          <p className="font-sans text-xs text-[#77736d] leading-relaxed">
            Clear explanation of what the visitor or responder can expect.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[#cc785c]">
            04 &bull; UPDATE
          </div>
          <div className="font-serif text-base text-[#faf9f5]">
            Chronological Log
          </div>
          <p className="font-sans text-xs text-[#77736d] leading-relaxed">
            Real-time notes published directly by the on-call incident team.
          </p>
        </div>
      </div>
    </section>
  );
}
