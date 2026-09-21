import * as React from "react";

export type SystemStateType =
  | "404"
  | "403"
  | "500"
  | "OFFLINE"
  | "RESTORED"
  | "DEGRADED";

interface SystemSignalRailProps {
  type: SystemStateType;
  className?: string;
}

export function SystemSignalRail({ type, className = "" }: SystemSignalRailProps) {
  if (type === "404") {
    return (
      <div
        className={`w-full max-w-[420px] py-4 font-mono text-[10px] uppercase tracking-wider text-[#8e8b82] dark:text-[#77736d] ${className}`}
        role="img"
        aria-label="Lost signal railway diagram: Request dispatched, no story found"
      >
        {/* Top Rail: Request to Junction */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#141413] dark:text-[#faf9f5]">REQUEST</span>
          <span className="h-2 w-2 rounded-full bg-[#cc785c]" />
          <span className="h-px flex-1 bg-[#cc785c]" />
          <span className="h-2 w-2 rounded-full bg-[#cc785c]" />
        </div>

        {/* Drop Down Line to Empty Node */}
        <div className="flex justify-end pr-[3px]">
          <div className="h-6 w-px bg-[#e6dfd8] dark:bg-[#2e2b27]" />
        </div>

        {/* Bottom Terminus */}
        <div className="flex items-center justify-end gap-2">
          <span className="text-[#8e8b82] dark:text-[#77736d]">NO STORY</span>
          <span className="h-2 w-2 rounded-full border border-[#cc785c] bg-transparent" />
        </div>
      </div>
    );
  }

  if (type === "403") {
    return (
      <div
        className={`w-full max-w-[420px] py-4 font-mono text-[10px] uppercase tracking-wider text-[#8e8b82] dark:text-[#77736d] ${className}`}
        role="img"
        aria-label="Access boundary railway diagram: Request stopped at access check barrier"
      >
        {/* Top Rail: Request to Access Check */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#141413] dark:text-[#faf9f5]">REQUEST</span>
          <span className="h-2 w-2 rounded-full bg-[#cc785c]" />
          <span className="h-px flex-1 bg-[#e6dfd8] dark:bg-[#2e2b27]" />
          <span className="h-2 w-2 rounded-full border border-[#d97706] bg-[#d97706]" />
          <span className="text-[#d97706] font-medium">ACCESS CHECK</span>
        </div>

        {/* Drop Down Line to Restricted Gate */}
        <div className="flex justify-end pr-28 sm:pr-32">
          <div className="h-6 w-px bg-[#d97706]/60" />
        </div>

        {/* Bottom Barrier */}
        <div className="flex items-center justify-end gap-2 pr-20 sm:pr-24">
          <span className="font-semibold text-[#d97706]">RESTRICTED</span>
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#d97706]/15 text-[#d97706] font-bold text-[9px]">
            &times;
          </span>
        </div>
      </div>
    );
  }

  if (type === "500") {
    return (
      <div
        className={`w-full max-w-[420px] py-4 font-mono text-[10px] uppercase tracking-wider text-[#8e8b82] dark:text-[#77736d] ${className}`}
        role="img"
        aria-label="Interrupted signal diagram: Request stopped at execution process"
      >
        {/* Top Rail: Request to Process */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#141413] dark:text-[#faf9f5]">REQUEST</span>
          <span className="h-2 w-2 rounded-full bg-[#cc785c]" />
          <span className="h-px flex-1 bg-[#e6dfd8] dark:bg-[#2e2b27]" />
          <span className="h-2 w-2 rounded-full bg-[#c64545]" />
          <span className="text-[#c64545] font-medium">PROCESS</span>
        </div>

        {/* Diagonal Disconnect Line */}
        <div className="flex justify-end pr-14 sm:pr-18">
          <div className="h-6 w-px -rotate-45 transform bg-[#c64545]" />
        </div>

        {/* Bottom Interrupted Terminus */}
        <div className="flex items-center justify-end gap-2 pr-6 sm:pr-10">
          <span className="font-semibold text-[#c64545]">INTERRUPTED</span>
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#c64545]/15 text-[#c64545] font-bold text-[10px]">
            &times;
          </span>
        </div>
      </div>
    );
  }

  if (type === "OFFLINE") {
    return (
      <div
        className={`w-full max-w-[420px] py-4 font-mono text-[10px] uppercase tracking-wider text-[#8e8b82] dark:text-[#77736d] ${className}`}
        role="img"
        aria-label="Offline network diagram: Device disconnected from journal stream"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#8e8b82]" />
            <span className="font-semibold text-[#141413] dark:text-[#faf9f5]">DEVICE</span>
          </div>

          <div className="relative flex flex-1 items-center">
            {/* Connected portion */}
            <span className="h-px w-2/5 bg-[#8e8b82]" />
            {/* Disconnected break */}
            <span className="mx-2 h-1.5 w-1.5 rounded-full border border-[#8e8b82] bg-transparent" />
            <span className="h-px flex-1 border-b border-dashed border-[#e6dfd8] dark:border-[#2e2b27]" />
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full border border-[#8e8b82] bg-transparent" />
            <span>JOURNAL</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === "RESTORED") {
    return (
      <div
        className={`w-full max-w-[420px] py-4 font-mono text-[10px] uppercase tracking-wider text-[#8e8b82] dark:text-[#77736d] ${className}`}
        role="img"
        aria-label="Restored network diagram: Device reconnected to journal stream"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#5db8a6]" />
            <span className="font-semibold text-[#141413] dark:text-[#faf9f5]">DEVICE</span>
          </div>

          <div className="flex flex-1 items-center">
            <span className="h-px flex-1 bg-[#5db8a6]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#5db8a6]" />
            <span className="h-px flex-1 bg-[#5db8a6]" />
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#5db8a6]" />
            <span className="font-semibold text-[#5db8a6]">JOURNAL</span>
          </div>
        </div>
      </div>
    );
  }

  // DEGRADED
  return (
    <div
      className={`w-full max-w-[360px] space-y-2 py-3 font-mono text-[9px] uppercase tracking-wider text-[#8e8b82] dark:text-[#77736d] ${className}`}
      role="img"
      aria-label="Degraded content diagram: Article text active, visual media fallback"
    >
      <div className="flex items-center justify-between">
        <span>CONTENT</span>
        <div className="flex flex-1 items-center px-3">
          <span className="h-px flex-1 bg-[#5db8a6]" />
        </div>
        <span className="font-semibold text-[#5db8a6]">ACTIVE</span>
      </div>

      <div className="flex items-center justify-between">
        <span>MEDIA</span>
        <div className="flex flex-1 items-center px-3">
          <span className="h-px w-1/2 bg-[#cc785c]" />
          <span className="h-1.5 w-1.5 rounded-full border border-[#cc785c]" />
        </div>
        <span className="text-[#cc785c]">FALLBACK FIELD</span>
      </div>
    </div>
  );
}
