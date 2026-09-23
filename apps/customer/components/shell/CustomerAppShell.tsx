"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { VaahanIcon } from "@vaahansafe/icons";
import { ThemeToggle } from "@vaahansafe/ui/theme";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface CustomerAppShellProps {
  userPhone?: string;
  userName?: string;
  userEmail?: string;
  phoneVerified?: boolean;
  vehicles?: Array<{
    id: string;
    registrationNumber: string;
    make: string;
    model: string;
    publicQrId?: string;
  }>;
  unreadNotificationCount?: number;
  children: React.ReactNode;
}

function getBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  if (pathname === "/" || pathname === "/dashboard") {
    return [{ label: "Overview" }, { label: "Dashboard" }];
  }
  if (pathname.startsWith("/vehicles")) {
    if (pathname === "/vehicles/new") {
      return [{ label: "Vehicles", href: "/vehicles" }, { label: "Add Vehicle" }];
    }
    return [{ label: "Vehicle Identity" }, { label: "Vehicles" }];
  }
  if (pathname.startsWith("/qr")) {
    const subRoute = pathname.replace("/qr", "").replace("/", "");
    const subLabels: Record<string, string> = {
      buy: "Buy QR",
      activate: "Activate Retail QR",
      codes: "Active QR Codes",
      digital: "Digital QR Pass",
      replace: "Replace QR",
    };
    if (subRoute && subLabels[subRoute]) {
      return [
        { label: "My QR", href: "/qr" },
        { label: subLabels[subRoute]! },
      ];
    }
    return [{ label: "Vehicle Identity" }, { label: "My QR" }];
  }
  if (pathname.startsWith("/subscription")) {
    return [{ label: "Services" }, { label: "Subscription" }];
  }
  if (pathname.startsWith("/orders")) {
    return [{ label: "Services" }, { label: "Orders" }];
  }
  if (pathname.startsWith("/payments")) {
    return [{ label: "Services" }, { label: "Payments" }];
  }
  if (pathname.startsWith("/emergency-contacts")) {
    return [{ label: "Services" }, { label: "Emergency Contacts" }];
  }
  if (pathname.startsWith("/scan-history")) {
    return [{ label: "Activity" }, { label: "Scan History" }];
  }
  if (pathname.startsWith("/notifications")) {
    return [{ label: "Activity" }, { label: "Notifications" }];
  }
  if (pathname.startsWith("/settings")) {
    if (pathname === "/settings/profile") {
      return [{ label: "Settings", href: "/settings" }, { label: "Personal Profile" }];
    }
    if (pathname === "/settings/security") {
      return [{ label: "Settings", href: "/settings" }, { label: "Security & Sessions" }];
    }
    return [{ label: "Account" }, { label: "Settings" }];
  }
  return [{ label: "Vehicle Identity" }, { label: "Dashboard" }];
}

export function CustomerAppShell({
  userPhone,
  userName,
  userEmail,
  phoneVerified = false,
  vehicles = [],
  unreadNotificationCount = 0,
  children,
}: CustomerAppShellProps) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);
  const activeVehicle = vehicles[0];

  return (
    <SidebarProvider defaultOpen={true}>
      {/* 01. Sidebar */}
      <AppSidebar
        className="print:hidden"
        user={{
          name: userName,
          phone: userPhone,
          email: userEmail,
          phoneVerified,
        }}
        vehicles={vehicles}
      />

      {/* 02. Inset Canvas */}
      <SidebarInset className="bg-background flex flex-col min-h-[100dvh] min-w-0 w-full max-w-full overflow-x-clip">
        {/* Contextual Fixed Top Bar with SidebarTrigger, Separator, Breadcrumb & ThemeToggle */}
        <header className="sticky top-0 z-40 flex h-14 w-full shrink-0 items-center justify-between gap-2.5 sm:gap-3 border-b border-border bg-background/95 px-3.5 backdrop-blur-md sm:px-6 print:hidden">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden">
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground hover:bg-accent shrink-0" />
            <Separator orientation="vertical" className="mr-1.5 sm:mr-2 h-4 bg-border shrink-0" />
            <Breadcrumb className="min-w-0 flex-1 overflow-hidden">
              <BreadcrumbList className="flex-nowrap overflow-hidden text-xs sm:text-sm">
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <React.Fragment key={crumb.label}>
                      <BreadcrumbItem className="min-w-0 truncate">
                        {isLast ? (
                          <BreadcrumbPage className="font-medium text-foreground truncate">
                            {crumb.label}
                          </BreadcrumbPage>
                        ) : crumb.href ? (
                          <BreadcrumbLink
                            href={crumb.href}
                            className="text-muted-foreground hover:text-[#cc785c] transition-colors truncate"
                          >
                            {crumb.label}
                          </BreadcrumbLink>
                        ) : (
                          <span className="text-muted-foreground truncate">{crumb.label}</span>
                        )}
                      </BreadcrumbItem>
                      {!isLast && (
                        <BreadcrumbSeparator className="text-muted-foreground shrink-0" />
                      )}
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Right Header Tools */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Active Vehicle Context */}
            {vehicles.length > 0 && activeVehicle ? (
              <div className="hidden sm:flex h-8 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 shrink-0">
                <span className="text-[#cc785c]">
                  <VaahanIcon name="vehicle" size={13} aria-hidden="true" />
                </span>
                <span className="font-mono text-xs font-bold uppercase text-foreground leading-none">
                  {activeVehicle.registrationNumber}
                </span>
              </div>
            ) : (
              <Link
                href="/vehicles"
                className="hidden sm:inline-flex h-8 items-center gap-1.5 rounded-lg border border-dashed border-[#cc785c]/60 bg-[#cc785c]/5 px-3 text-xs font-medium text-[#cc785c] hover:bg-[#cc785c]/10 transition-colors shrink-0"
              >
                <span className="font-mono text-xs font-bold leading-none">+</span>
                <span>Link Vehicle</span>
              </Link>
            )}

            {/* Notification Bell */}
            <Link
              href="/notifications"
              aria-label={`Notifications${unreadNotificationCount > 0 ? `, ${unreadNotificationCount} unread` : ""}`}
              className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:border-[#cc785c] hover:text-[#cc785c] transition-colors"
            >
              <VaahanIcon name="notification" size={15} aria-hidden="true" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#cc785c] px-1 font-mono text-[8px] font-bold text-white shadow-xs">
                  {unreadNotificationCount}
                </span>
              )}
            </Link>

            {/* Theme Toggle (Dark & Light) */}
            <ThemeToggle className="h-8 w-8 shrink-0 rounded-lg border border-border bg-background text-muted-foreground hover:border-[#cc785c] hover:text-[#cc785c] transition-colors" />
          </div>
        </header>

        {/* Dynamic Page Content inside Inset Canvas */}
        <div
          id="main-app-content"
          className="flex-1 p-3.5 sm:p-6 lg:p-8 w-full min-w-0 max-w-full pb-20 md:pb-8 overflow-x-clip print:p-0 print:m-0"
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
