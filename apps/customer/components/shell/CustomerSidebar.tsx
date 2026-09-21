"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { VaahanSafeLogo } from "@vaahansafe/ui/brand";
import { VaahanIcon } from "@vaahansafe/icons";
import { CUSTOMER_NAVIGATION, isNavActive, type AppNavigationItem } from "../../config/navigation";

interface CustomerSidebarProps {
  userPhone?: string;
  userName?: string;
  userEmail?: string;
  phoneVerified?: boolean;
  onCloseMobile?: () => void;
  onOpenMobileMyQr?: () => void;
  onSignOut?: () => void;
}

export function CustomerSidebar({
  userPhone,
  userName,
  userEmail,
  phoneVerified,
  onCloseMobile,
  onOpenMobileMyQr,
  onSignOut,
}: CustomerSidebarProps) {
  const pathname = usePathname();

  // "My QR" is expanded by default if the user is currently on any /qr route or active child
  const hasActiveQrChild = CUSTOMER_NAVIGATION.some((group) =>
    group.items.some((item) =>
      item.children?.some((child) => pathname === child.href)
    )
  );
  const isQrRouteActive = pathname.startsWith("/qr");
  const [isExpanded, setIsExpanded] = React.useState(
    hasActiveQrChild || isQrRouteActive
  );
  const isQrExpanded = isExpanded;
  const setIsQrExpanded = setIsExpanded;

  // Auto-expand when navigating to a QR sub-route
  React.useEffect(() => {
    if (isQrRouteActive || hasActiveQrChild) {
      setIsExpanded(true);
    }
  }, [isQrRouteActive]);

  const displayName =
    userName?.trim() ||
    (userEmail ? userEmail.split("@")[0] : undefined) ||
    (userPhone ? (userPhone.startsWith("+91") ? `+91 ${userPhone.slice(-10)}` : userPhone) : "Vehicle Owner");

  const avatarInitial = (
    userName?.trim() ||
    userEmail ||
    "V"
  )
    .charAt(0)
    .toUpperCase();

  const isVerified = phoneVerified ?? Boolean(userPhone);

  const maskedIdentifier = userPhone
    ? (userPhone.length >= 4 ? `+91 ••••• ${userPhone.slice(-4)}` : userPhone)
    : userEmail
    ? userEmail.replace(/(.{2})(.*)(?=@)/, (_m, g1) => g1 + "•••")
    : "Unverified";

  return (
    <aside
      aria-label="Customer application navigation"
      className="
        flex h-full w-[272px] flex-col justify-between
        border-r border-sidebar-border bg-sidebar text-sidebar-foreground select-none
      "
    >
      {/* 01. Brand Header */}
      <div className="p-5 pb-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            onClick={onCloseMobile}
            className="inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]"
          >
            <VaahanSafeLogo size="sm" variant="brand" showTagline={false} />
          </Link>

          {/* Close button for mobile drawer */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground md:hidden"
            >
              <VaahanIcon name="close" size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Signature Mono Identity Rail */}
        <div className="mt-3 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
          <span className="h-px w-5 bg-[#cc785c]/40" />
          <span>VEHICLE IDENTITY</span>
        </div>
      </div>

      {/* 02. Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {CUSTOMER_NAVIGATION.map((group) => (
          <div key={group.id} className="space-y-1.5">
            {/* Group Header */}
            <div className="px-3 font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {group.label}
            </div>

            {/* Group Items */}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const hasChildren = Boolean(item.children && item.children.length > 0);
                const isActive = isNavActive(pathname, item);

                // For "My QR": Special expandable hierarchy
                if (hasChildren) {
                  return (
                    <div key={item.id} className="space-y-1">
                      {/* Parent Button / Link */}
                      <div
                        className={`
                          group relative flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150
                          ${
                            isActive
                              ? "bg-sidebar-accent text-sidebar-foreground shadow-xs"
                              : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                          }
                        `}
                      >
                        {/* Thin Coral Active Rail */}
                        {isActive && (
                          <span
                            className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#cc785c]"
                            aria-hidden="true"
                          />
                        )}

                        <Link
                          href={item.href}
                          onClick={onCloseMobile}
                          className="flex flex-1 items-center gap-2.5 focus:outline-none"
                        >
                          <span
                            className={`transition-colors ${
                              isActive ? "text-[#cc785c]" : "text-muted-foreground group-hover:text-sidebar-foreground"
                            }`}
                          >
                            <VaahanIcon name={item.icon} size={16} aria-hidden="true" />
                          </span>
                          <span>{item.label}</span>
                        </Link>

                        {/* Expand / Collapse toggle */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setIsQrExpanded(!isQrExpanded);
                          }}
                          aria-expanded={isQrExpanded}
                          aria-label={`${isQrExpanded ? "Collapse" : "Expand"} ${item.label} sub-routes`}
                          className="rounded p-1 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        >
                          <span className="font-mono text-xs font-bold leading-none select-none">
                            {isQrExpanded ? "−" : "+"}
                          </span>
                        </button>
                      </div>

                      {/* Expandable Relationship Rail & Children */}
                      {isQrExpanded && item.children && (
                        <div
                          role="region"
                          aria-label={`${item.label} destinations`}
                          className="ml-4 border-l border-sidebar-border pl-3 pt-0.5 pb-1 space-y-0.5"
                        >
                          {item.children.map((child) => {
                            const isChildActive = pathname === child.href;

                            return (
                              <Link
                                key={child.id}
                                href={child.href}
                                onClick={onCloseMobile}
                                className={`
                                  group relative flex items-center justify-between rounded-md px-2.5 py-1.5 text-[12.5px] transition-colors
                                  ${
                                    isChildActive
                                      ? "bg-sidebar-accent font-medium text-[#cc785c]"
                                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                  }
                                `}
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`transition-colors ${
                                      isChildActive ? "text-[#cc785c]" : "text-muted-foreground group-hover:text-sidebar-foreground"
                                    }`}
                                  >
                                    <VaahanIcon name={child.icon} size={14} aria-hidden="true" />
                                  </span>
                                  <span>{child.label}</span>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                // Standard Top-Level Navigation Link
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onCloseMobile}
                    aria-current={isActive ? "page" : undefined}
                    className={`
                      group relative flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150
                      ${
                        isActive
                          ? "bg-sidebar-accent text-sidebar-foreground border-l-2 border-[#cc785c] shadow-xs"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      }
                    `}
                  >
                    {/* Thin Coral Active Left Rail */}
                    {isActive && (
                      <span
                        className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#cc785c]"
                        aria-hidden="true"
                      />
                    )}

                    <div className="flex items-center gap-2.5">
                      <span
                        className={`transition-colors ${
                          isActive ? "text-[#cc785c]" : "text-muted-foreground group-hover:text-sidebar-foreground"
                        }`}
                      >
                        <VaahanIcon name={item.icon} size={16} aria-hidden="true" />
                      </span>
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="rounded bg-[#cc785c]/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#cc785c]">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 03. User Identity Footer */}
      <div className="border-t border-sidebar-border p-3 bg-sidebar">
        <div className="flex items-center justify-between rounded-xl bg-sidebar-accent/50 p-2 border border-sidebar-border transition-colors">
          <Link
            href="/settings/profile"
            onClick={onCloseMobile}
            className="group flex items-center gap-2.5 min-w-0 flex-1 mr-1.5 focus:outline-none"
            title="Manage Profile & Settings"
          >
            {/* Dynamic Coral Initial Avatar */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#cc785c]/15 text-[#cc785c] font-mono font-bold text-xs border border-[#cc785c]/30 group-hover:bg-[#cc785c]/25 group-hover:border-[#cc785c]/50 transition-all">
              {avatarInitial}
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-sidebar-foreground group-hover:text-[#cc785c] transition-colors">
                {displayName}
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    isVerified ? "bg-[#5db8a6]" : "bg-[#e5a83b]"
                  }`}
                />
                <span className="truncate text-[10px]">{maskedIdentifier}</span>
                <span
                  className={`shrink-0 rounded px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wider ${
                    isVerified
                      ? "bg-[#5db8a6]/10 text-[#5db8a6] border border-[#5db8a6]/20"
                      : "bg-[#e5a83b]/10 text-[#e5a83b] border border-[#e5a83b]/20"
                  }`}
                >
                  {isVerified ? "VERIFIED" : "PENDING"}
                </span>
              </div>
            </div>
          </Link>

          {/* Sign Out Action */}
          <form action="/api/auth/logout" method="POST" className="shrink-0">
            <button
              type="submit"
              aria-label="Sign out of VaahanSafe account"
              title="Sign Out"
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#cc785c]"
            >
              <span className="hidden xl:inline text-[11px] whitespace-nowrap">Sign out</span>
              <VaahanIcon name="arrow-right" size={13} aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
