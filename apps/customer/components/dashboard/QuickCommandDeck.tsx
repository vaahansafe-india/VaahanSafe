"use client";

import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";

interface QuickCommandDeckProps {
  onManageVehicle: () => void;
  onViewQr: () => void;
  onEditSafetyView: () => void;
  onEmergencyContacts: () => void;
}

export function QuickCommandDeck({
  onManageVehicle,
  onViewQr,
  onEditSafetyView,
  onEmergencyContacts,
}: QuickCommandDeckProps) {
  return (
    <section aria-label="Quick Command Deck" className="space-y-2">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        QUICK COMMAND DECK
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6 w-full max-w-full">
        {/* Manage Vehicle */}
        <button
          type="button"
          onClick={onManageVehicle}
          className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-3 text-center shadow-2xs transition-all hover:border-[#cc785c]/40 hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-[#cc785c]/30 min-w-0"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-[#cc785c] transition-colors group-hover:bg-[#cc785c] group-hover:text-white">
            <VaahanIcon name="vehicle" size={17} />
          </span>
          <div className="w-full min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">Manage Vehicle</div>
            <div className="text-[10px] text-muted-foreground truncate">Specs &amp; updates</div>
          </div>
        </button>

        {/* View QR */}
        <button
          type="button"
          onClick={onViewQr}
          className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-3 text-center shadow-2xs transition-all hover:border-[#cc785c]/40 hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-[#cc785c]/30 min-w-0"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-[#cc785c] transition-colors group-hover:bg-[#cc785c] group-hover:text-white">
            <VaahanIcon name="qr" size={17} />
          </span>
          <div className="w-full min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">View QR Identity</div>
            <div className="text-[10px] text-muted-foreground truncate">Status &amp; code</div>
          </div>
        </button>

        {/* Edit Safety View */}
        <button
          type="button"
          onClick={onEditSafetyView}
          className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-3 text-center shadow-2xs transition-all hover:border-[#cc785c]/40 hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-[#cc785c]/30 min-w-0"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-[#5db8a6] transition-colors group-hover:bg-[#5db8a6] group-hover:text-white">
            <VaahanIcon name="shield" size={17} />
          </span>
          <div className="w-full min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">Edit Safety View</div>
            <div className="text-[10px] text-muted-foreground truncate">Privacy toggles</div>
          </div>
        </button>

        {/* Emergency Contacts */}
        <button
          type="button"
          onClick={onEmergencyContacts}
          className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-3 text-center shadow-2xs transition-all hover:border-[#cc785c]/40 hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-[#cc785c]/30 min-w-0"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-[#5db8a6] transition-colors group-hover:bg-[#5db8a6] group-hover:text-white">
            <VaahanIcon name="phone" size={17} />
          </span>
          <div className="w-full min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">Contacts</div>
            <div className="text-[10px] text-muted-foreground truncate">Priority alerts</div>
          </div>
        </button>

        {/* Buy QR */}
        <Link
          href="/qr/buy"
          className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-3 text-center shadow-2xs transition-all hover:border-[#cc785c]/40 hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-[#cc785c]/30 min-w-0"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-[#cc785c] transition-colors group-hover:bg-[#cc785c] group-hover:text-white">
            <VaahanIcon name="cart" size={17} />
          </span>
          <div className="w-full min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">Buy QR Sticker</div>
            <div className="text-[10px] text-muted-foreground truncate">Doorstep dispatch</div>
          </div>
        </Link>

        {/* Activate Retail QR */}
        <Link
          href="/qr/activate"
          className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-3 text-center shadow-2xs transition-all hover:border-[#cc785c]/40 hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-[#cc785c]/30 min-w-0"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-[#cc785c] transition-colors group-hover:bg-[#cc785c] group-hover:text-white">
            <VaahanIcon name="qr-scan" size={17} />
          </span>
          <div className="w-full min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">Activate Retail QR</div>
            <div className="text-[10px] text-muted-foreground truncate">Scan kit code</div>
          </div>
        </Link>
      </div>
    </section>
  );
}
