import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function ProjectionBoundaryDiagram() {
  const allowedFields = [
    { label: "Display Name", note: "Optional alias approved by owner" },
    { label: "Blood Group", note: "Crucial for urgent medical triage" },
    { label: "Emergency Notes", note: "Allergies, conditions, or instructions" },
    { label: "Selected Contact", note: "Priority emergency contact number" },
  ];

  const blockedFields = [
    { label: "Physical Address", note: "Never sent over the wire" },
    { label: "Primary Account Phone", note: "Kept private behind server relay" },
    { label: "Payment & Banking", note: "Zero commercial data exposed" },
    { label: "Vehicle Order History", note: "Internal account truth only" },
  ];

  return (
    <div className="w-full rounded-2xl border border-[var(--qr-line)] bg-[var(--qr-paper)] p-6 sm:p-8 space-y-8 shadow-xs">
      <div className="space-y-2">
        <p className="qr-label">Architectural Boundary</p>
        <h3 className="font-serif text-2xl sm:text-3xl font-medium text-foreground tracking-tight">
          Only the approved public view <br className="hidden sm:inline" />
          is returned to a scan.
        </h3>
        <p className="qr-muted text-xs sm:text-sm leading-relaxed max-w-xl">
          VaahanSafe strictly separates account records from public emergency resolution.
          Server-side projection ensures private fields never touch the browser.
        </p>
      </div>

      {/* Responsive Diagram: Grid Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-2">
        {/* Approved Projection Side */}
        <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
            <span className="font-mono text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300">
              Approved Safety View
            </span>
            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
              PROJECTED &rarr;
            </span>
          </div>

          <div className="space-y-3">
            {allowedFields.map((f) => (
              <div key={f.label} className="flex items-start gap-2.5">
                <span className="size-4 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <VaahanIcon name="check" size={12} />
                </span>
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-foreground block">
                    {f.label}
                  </span>
                  <span className="text-[11px] qr-muted block">
                    {f.note}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blocked Private Storage Side */}
        <div className="p-5 rounded-xl border border-[var(--qr-line)] bg-[var(--qr-surface)]/60 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--qr-line)]">
            <span className="font-mono text-xs font-bold uppercase qr-muted">
              Private Account Storage
            </span>
            <span className="font-mono text-[10px] text-destructive font-semibold">
              BLOCKED &times;
            </span>
          </div>

          <div className="space-y-3">
            {blockedFields.map((f) => (
              <div key={f.label} className="flex items-start gap-2.5 opacity-80">
                <span className="size-4 rounded-full bg-destructive/15 text-destructive flex items-center justify-center shrink-0 mt-0.5">
                  <VaahanIcon name="error" size={12} />
                </span>
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-foreground block">
                    {f.label}
                  </span>
                  <span className="text-[11px] qr-muted block">
                    {f.note}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Signature Projection Boundary Footnote */}
      <div className="pt-4 border-t border-[var(--qr-line)] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <span className="font-mono text-[11px] text-foreground font-semibold">
          PRIVATE ACCOUNT &rarr; CONTROLLED PROJECTION &rarr; PUBLIC SAFETY VIEW
        </span>
        <span className="font-mono text-[10px] qr-muted">
          Zero Private Leaks &bull; Server Whitelist Verified
        </span>
      </div>
    </div>
  );
}
