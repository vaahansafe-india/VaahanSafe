import React from "react";

export interface IdentityPathProps {
  activeNode?: "CAMERA" | "QR" | "ID" | "RESOLVER" | "SAFETY";
}

export function IdentityPath({ activeNode = "CAMERA" }: IdentityPathProps) {
  const nodes = [
    { key: "CAMERA", label: "01 Camera Scan" },
    { key: "QR", label: "02 QR Code" },
    { key: "ID", label: "03 Public ID" },
    { key: "RESOLVER", label: "04 Edge Resolver" },
    { key: "SAFETY", label: "05 Safety View" },
  ];

  return (
    <nav aria-label="Resolution Path Progress" className="w-full py-3.5 border-y border-[var(--qr-line)] bg-[var(--qr-surface)] select-none">
      <div className="qr-container">
        {/* Desktop Horizontal Milestone Trail */}
        <div className="hidden md:flex items-center justify-between">
          {nodes.map((n, idx) => {
            const isActive = n.key === activeNode;
            return (
              <React.Fragment key={n.key}>
                <div className="flex items-center gap-2.5">
                  <span
                    className={`size-2.5 rounded-full transition-all ${
                      isActive
                        ? "bg-[var(--qr-accent)] ring-4 ring-[var(--qr-accent)]/20 scale-110"
                        : "bg-[var(--qr-muted)]/50"
                    }`}
                  />
                  <span
                    className={`font-mono text-xs uppercase tracking-wider ${
                      isActive ? "text-[var(--qr-accent)] font-bold" : "qr-muted"
                    }`}
                  >
                    {n.label}
                  </span>
                </div>
                {idx < nodes.length - 1 && (
                  <div className="flex-1 h-px bg-[var(--qr-line)] mx-4" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile Horizontal Compact Badge Indicator */}
        <div className="flex md:hidden items-center justify-between text-[11px] font-mono uppercase tracking-wider qr-muted">
          <span className="flex items-center gap-2 text-foreground font-semibold">
            <span className="size-2 rounded-full bg-[var(--qr-accent)] ring-2 ring-[var(--qr-accent)]/20" />
            Scanner Path
          </span>
          <span>Camera &rarr; QR &rarr; Public Pass</span>
        </div>
      </div>
    </nav>
  );
}
