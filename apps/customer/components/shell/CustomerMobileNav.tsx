"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { VaahanIcon } from "@vaahansafe/icons";
import { CustomerSidebar } from "./CustomerSidebar";
import { MobileMyQrSheet } from "./MobileMyQrSheet";

interface CustomerMobileNavProps {
  userPhone?: string;
  userName?: string;
  userEmail?: string;
  phoneVerified?: boolean;
  isDrawerOpen: boolean;
  onCloseDrawer: () => void;
  onOpenDrawer: () => void;
}

export function CustomerMobileNav({
  userPhone,
  userName,
  userEmail,
  phoneVerified,
  isDrawerOpen,
  onCloseDrawer,
}: CustomerMobileNavProps) {
  const pathname = usePathname();
  const [isQrSheetOpen, setIsQrSheetOpen] = React.useState(false);

  const isDashboardActive = pathname === "/" || pathname === "/dashboard";
  const isVehiclesActive = pathname.startsWith("/vehicles");
  const isQrActive = pathname.startsWith("/qr");
  const isActivityActive = pathname.startsWith("/scan-history") || pathname.startsWith("/notifications");
  const isAccountActive = pathname.startsWith("/settings");

  return (
    <>
      {/* 01. Full Slide-Over Drawer for Mobile */}
      {isDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Drawer"
          className="fixed inset-0 z-50 flex md:hidden"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseDrawer}
            aria-hidden="true"
          />

          {/* Sidebar container */}
          <div className="relative z-10 flex h-full w-[272px] max-w-[80vw] flex-col bg-sidebar shadow-2xl">
            <CustomerSidebar
              userPhone={userPhone}
              userName={userName}
              userEmail={userEmail}
              phoneVerified={phoneVerified}
              onCloseMobile={onCloseDrawer}
              onOpenMobileMyQr={() => {
                onCloseDrawer();
                setIsQrSheetOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* 02. Dedicated Mobile "My QR" Action Sheet */}
      <MobileMyQrSheet
        isOpen={isQrSheetOpen}
        onClose={() => setIsQrSheetOpen(false)}
      />

      {/* 03. Bottom Navigation Bar for Mobile */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-center justify-around border-t border-border bg-background/95 px-2 backdrop-blur-sm md:hidden"
      >
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
            isDashboardActive ? "text-[#cc785c]" : "text-muted-foreground"
          }`}
        >
          <VaahanIcon name="dashboard" size={18} aria-hidden="true" />
          <span>Overview</span>
        </Link>

        {/* Vehicles */}
        <Link
          href="/vehicles"
          className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
            isVehiclesActive ? "text-[#cc785c]" : "text-muted-foreground"
          }`}
        >
          <VaahanIcon name="vehicle" size={18} aria-hidden="true" />
          <span>Vehicles</span>
        </Link>

        {/* My QR (Triggers Dedicated Sheet) */}
        <button
          type="button"
          onClick={() => setIsQrSheetOpen(true)}
          className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
            isQrActive ? "text-[#cc785c]" : "text-muted-foreground"
          }`}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#cc785c]/10 text-[#cc785c]">
            <VaahanIcon name="qr" size={16} aria-hidden="true" />
          </span>
          <span>My QR</span>
        </button>

        {/* Activity */}
        <Link
          href="/scan-history"
          className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
            isActivityActive ? "text-[#cc785c]" : "text-muted-foreground"
          }`}
        >
          <VaahanIcon name="activity" size={18} aria-hidden="true" />
          <span>Activity</span>
        </Link>

        {/* Account */}
        <Link
          href="/settings"
          className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
            isAccountActive ? "text-[#cc785c]" : "text-muted-foreground"
          }`}
        >
          <VaahanIcon name="settings" size={18} aria-hidden="true" />
          <span>Account</span>
        </Link>
      </nav>
    </>
  );
}
