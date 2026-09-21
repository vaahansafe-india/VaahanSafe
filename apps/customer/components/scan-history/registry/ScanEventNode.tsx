"use client";

interface ScanEventNodeProps {
  isEmergency?: boolean;
}

export function ScanEventNode({ isEmergency }: ScanEventNodeProps) {
  return (
    <div className="relative flex flex-col items-center">
      {/* Node circle */}
      <span
        className={`size-2.5 rounded-full ring-4 ring-card transition-colors ${
          isEmergency ? "bg-destructive" : "bg-primary"
        }`}
      />
      {/* Vertical faint identity rail connecting nodes */}
      <span className="w-px flex-1 bg-border/70 my-1 group-last:hidden" />
    </div>
  );
}
