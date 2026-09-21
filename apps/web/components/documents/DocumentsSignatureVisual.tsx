import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function DocumentsSignatureVisual() {
  const tiers = [
    { level: "01", label: "Product", desc: "How decals, identifiers, and public safety screens connect.", icon: "qr-code" as const },
    { level: "02", label: "Guidance", desc: "Operational instructions for application and retail setup.", icon: "check" as const },
    { level: "03", label: "Policy", desc: "Statutory terms, replacement rules, and commercial rights.", icon: "shield" as const },
    { level: "04", label: "Reference", desc: "Real-time edge resolver health and system telemetry.", icon: "activity" as const },
  ];

  return (
    <section
      aria-labelledby="documents-visual-heading"
      className="
        border-b border-border
        bg-muted/50
        py-12 sm:py-16
        dark:border-border
        dark:bg-zinc-900/50
      "
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground dark:text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
            <h2 id="documents-visual-heading" className="m-0 font-mono text-[9px] uppercase tracking-[0.2em]">
              Documentation Hierarchy
            </h2>
          </div>

          <span className="font-mono text-[9px] text-[#cc785c]">
            VAAHANSAFE MANUAL INDEX
          </span>
        </div>

        {/* Technical Manual Index Rail */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier, idx) => (
            <div
              key={tier.level}
              className="
                relative flex flex-col justify-between rounded-xl
                border border-border bg-white p-5 shadow-sm
                dark:border-white/[0.08] dark:bg-zinc-950
              "
            >
              <div>
                <div className="flex items-center justify-between font-mono text-[9px]">
                  <span className="text-[#cc785c]">TIER {tier.level}</span>
                  {idx < tiers.length - 1 && (
                    <span className="hidden text-muted-foreground lg:block">→</span>
                  )}
                </div>

                <div className="mt-4 font-serif text-xl text-foreground dark:text-zinc-50">
                  {tier.label}
                </div>

                <p className="mt-1 text-xs text-muted-foreground dark:text-zinc-400">
                  {tier.desc}
                </p>
              </div>

              <div className="mt-4 border-t border-[#f0eae1] pt-3 font-mono text-[8px] uppercase tracking-wider text-muted-foreground dark:border-white/[0.06]">
                Official Specification
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
