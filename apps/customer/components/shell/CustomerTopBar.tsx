"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { VaahanIcon } from "@vaahansafe/icons";

interface VehicleContextOption {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  publicQrId?: string;
}

interface CustomerTopBarProps {
  vehicles?: VehicleContextOption[];
  unreadNotificationCount?: number;
  onOpenMobileMenu?: () => void;
}

export function CustomerTopBar({
  vehicles = [],
  unreadNotificationCount = 0,
  onOpenMobileMenu,
}: CustomerTopBarProps) {
  const pathname = usePathname();

  // Active Vehicle State (URL/session backed, fallback to first real vehicle)
  const [selectedVehicleId, setSelectedVehicleId] = React.useState<string>(
    vehicles[0]?.id || ""
  );

  const activeVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  // Resolve contextual heading based on current route
  const getContextTitle = () => {
    if (pathname === "/" || pathname === "/dashboard") return "Dashboard";
    if (pathname.startsWith("/vehicles")) return "Vehicles";
    if (pathname.startsWith("/qr/buy")) return "Buy QR";
    if (pathname.startsWith("/qr/activate")) return "Activate Retail QR";
    if (pathname.startsWith("/qr/codes")) return "QR Codes";
    if (pathname.startsWith("/qr/digital")) return "Digital QR";
    if (pathname.startsWith("/qr/replace")) return "Replace QR";
    if (pathname.startsWith("/qr")) return "My QR";
    if (pathname.startsWith("/subscription")) return "Subscription";
    if (pathname.startsWith("/orders")) return "Orders";
    if (pathname.startsWith("/payments")) return "Payments";
    if (pathname.startsWith("/emergency-contacts")) return "Emergency Contacts";
    if (pathname.startsWith("/scan-history")) return "Scan History";
    if (pathname.startsWith("/notifications")) return "Notifications";
    if (pathname.startsWith("/settings")) return "Profile & Settings";
    return "Vehicle Identity";
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm sm:h-15 sm:px-6">
      {/* 01. Left: Mobile Menu & Current Context */}
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation sidebar"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-[#cc785c] hover:text-[#cc785c] md:hidden"
          >
            <VaahanIcon name="menu" size={17} aria-hidden="true" />
          </button>
        )}

        <div className="flex flex-col">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            Current Context
          </span>
          <span className="font-serif text-lg font-medium leading-none text-foreground sm:text-xl">
            {getContextTitle()}
          </span>
        </div>
      </div>

      {/* 02. Right: Vehicle Context Selector & Actions */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* VEHICLE CONTEXT: Selector (Real Data or Intentional Empty State) */}
        <div aria-label="VEHICLE CONTEXT" className="flex items-center">
          {vehicles.length > 0 && activeVehicle ? (
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5">
            <span className="text-[#cc785c]">
              <VaahanIcon name="vehicle" size={14} aria-hidden="true" />
            </span>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="font-bold uppercase text-foreground">
                {activeVehicle.registrationNumber}
              </span>
              <span className="hidden lg:inline text-muted-foreground">
                ({activeVehicle.make} {activeVehicle.model})
              </span>
              {activeVehicle.publicQrId && (
                <span className="rounded bg-[#cc785c]/10 px-1 text-[10px] text-[#cc785c]">
                  {activeVehicle.publicQrId}
                </span>
              )}
            </div>
          </div>
        ) : (
          <Link
            href="/vehicles/new"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#cc785c]/60 bg-[#cc785c]/5 px-2.5 py-1 text-xs font-medium text-[#cc785c] transition-colors hover:bg-[#cc785c]/10"
          >
            <span className="font-mono text-xs font-bold leading-none">+</span>
            <span>Link Vehicle</span>
          </Link>
        )}
        </div>

        {/* Notifications Icon Button */}
        <Link
          href="/notifications"
          aria-label={`Notifications${unreadNotificationCount > 0 ? `, ${unreadNotificationCount} unread` : ""}`}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-[#cc785c] hover:text-[#cc785c]"
        >
          <VaahanIcon name="notification" size={16} aria-hidden="true" />
          {unreadNotificationCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#cc785c] px-1 font-mono text-[9px] font-bold text-white shadow-xs">
              {unreadNotificationCount}
            </span>
          )}
        </Link>

        {/* Direct Account Settings Link */}
        <Link
          href="/settings"
          aria-label="Profile and Settings"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-[#cc785c] hover:text-[#cc785c]"
        >
          <VaahanIcon name="settings" size={16} aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
