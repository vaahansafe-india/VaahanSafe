import React from "react";

interface VehicleQrAccessCardProps {
  endpoint?: string;
  state?: string;
  lastChecked?: string;
}

export function VehicleQrAccessCard({
  endpoint = "qr.vaahansafe.com",
  state = "OPERATIONAL",
  lastChecked = "Synchronized live",
}: VehicleQrAccessCardProps) {
  return (
    <div className="rounded-xl border border-[#E8E6DF] bg-white p-6 shadow-sm transition-all hover:border-[#141413]/20">
      <div className="flex items-center justify-between pb-4 border-b border-[#F0EFEA]">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold bg-[#CC785C]/10 text-[#CC785C]">
            CRITICAL PUBLIC PATH
          </span>
          <h3 className="font-serif text-lg font-semibold text-[#141413]">
            Vehicle QR Access
          </h3>
        </div>
        <span className="text-xs font-mono text-[#666660]">
          {endpoint}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4">
        <div>
          <span className="block text-[10px] font-mono uppercase tracking-widest text-[#8A8984]">
            CURRENT STATE
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="h-2 w-2 rounded-full bg-[#5DB872] animate-pulse" />
            <span className="text-sm font-medium text-[#141413]">
              {state}
            </span>
          </div>
        </div>

        <div>
          <span className="block text-[10px] font-mono uppercase tracking-widest text-[#8A8984]">
            LAST CHECKED
          </span>
          <span className="block mt-1 text-sm font-mono text-[#666660]">
            {lastChecked}
          </span>
        </div>
      </div>
    </div>
  );
}
