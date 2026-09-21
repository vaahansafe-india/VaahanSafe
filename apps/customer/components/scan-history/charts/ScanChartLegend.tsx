"use client";

export function ScanChartLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-[#CC785C]" />
        <span>Verified Scans</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-[#C64545]" />
        <span>Emergency Triggers</span>
      </div>
    </div>
  );
}
