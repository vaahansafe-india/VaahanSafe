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
    <nav aria-label="Resolution Path Progress" className="w-full py-4 border-y border-border/70 bg-card/40 select-none">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
                        ? "bg-primary ring-4 ring-primary/20 scale-110"
                        : "bg-muted-foreground/50"
                    }`}
                  />
                  <span
                    className={`font-mono text-xs uppercase tracking-wider ${
                      isActive ? "text-primary font-bold" : "text-muted-foreground"
                    }`}
                  >
                    {n.label}
                  </span>
                </div>
                {idx < nodes.length - 1 && (
                  <div className="flex-1 h-px bg-border/80 mx-4" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile Horizontal Compact Badge Indicator */}
        <div className="flex md:hidden items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          <span className="flex items-center gap-2 text-foreground font-semibold">
            <span className="size-2 rounded-full bg-primary ring-2 ring-primary/20" />
            Scanner Path
          </span>
          <span>Camera &rarr; QR &rarr; Public Pass</span>
        </div>
      </div>
    </nav>
  );
}
