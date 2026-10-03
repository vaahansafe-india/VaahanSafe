"use client";

import * as React from "react";
import { CustomerLink as Link } from "@/components/query/CustomerLink";
import { usePathname } from "next/navigation";
import { VaahanIcon } from "@vaahansafe/icons";
import { Alert, AlertDescription } from "@vaahansafe/ui";
import { Button } from "@/components/ui/button";
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
  googleVerified?: boolean;
  serviceUnavailable?: boolean;
  shellPending?: boolean;
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
      return [
        { label: "Vehicles", href: "/vehicles" },
        { label: "Add Vehicle" },
      ];
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
      return [{ label: "My QR", href: "/qr" }, { label: subLabels[subRoute]! }];
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
      return [
        { label: "Settings", href: "/settings" },
        { label: "Personal Profile" },
      ];
    }
    if (pathname === "/settings/security") {
      return [
        { label: "Settings", href: "/settings" },
        { label: "Security & Sessions" },
      ];
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
  googleVerified = false,
  serviceUnavailable = false,
  shellPending = false,
  vehicles = [],
  unreadNotificationCount = 0,
  children,
}: CustomerAppShellProps) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);
  const activeVehicle = vehicles[0];

  return (
    <SidebarProvider defaultOpen={true} className="customer-paper">
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
      <SidebarInset className="bg-transparent flex flex-col min-h-[100dvh] min-w-0 w-full max-w-full overflow-x-clip">
        {/* Navigation and account actions stay aligned with the page canvas. */}
        <header className="sticky top-0 z-40 flex h-14 w-full shrink-0 items-center justify-between gap-2 sm:gap-3 border-b border-border bg-background/95 px-3.5 backdrop-blur-md sm:px-6 lg:px-8 print:hidden">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden">
            <SidebarTrigger className="-ml-1 size-8 shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors" />
            <Separator
              orientation="vertical"
              className="mr-1.5 sm:mr-2 h-4 bg-border shrink-0"
            />
            <Breadcrumb className="min-w-0 flex-1 overflow-hidden">
              <BreadcrumbList className="flex-nowrap overflow-hidden text-xs sm:text-sm">
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <React.Fragment key={crumb.label}>
                      <BreadcrumbItem
                        className={`min-w-0 truncate ${!isLast ? "hidden sm:inline-flex" : ""}`}
                      >
                        {isLast ? (
                          <BreadcrumbPage className="font-medium text-foreground truncate">
                            {crumb.label}
                          </BreadcrumbPage>
                        ) : crumb.href ? (
                          <BreadcrumbLink
                            asChild
                            className="text-muted-foreground hover:text-[#cc785c] transition-colors truncate"
                          >
                            <Link href={crumb.href}>{crumb.label}</Link>
                          </BreadcrumbLink>
                        ) : (
                          <span className="text-muted-foreground truncate">
                            {crumb.label}
                          </span>
                        )}
                      </BreadcrumbItem>
                      {!isLast && (
                        <BreadcrumbSeparator className="hidden sm:block text-muted-foreground shrink-0" />
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
              <Button
                asChild
                variant="outline"
                className="hidden h-9 min-w-0 gap-2 bg-card px-3 sm:inline-flex"
              >
                <Link href="/vehicles" title="Manage your vehicles">
                  <VaahanIcon
                    name="vehicle"
                    size={16}
                    className="text-[#a9583e]"
                    aria-hidden="true"
                  />
                  <span className="max-w-40 truncate font-mono text-xs font-semibold uppercase">
                    {activeVehicle.registrationNumber}
                  </span>
                </Link>
              </Button>
            ) : !shellPending && !serviceUnavailable ? (
              <Button
                asChild
                variant="outline"
                className="h-9 w-9 border-[#d8d0c5] bg-card p-0 text-[#a9583e] sm:w-auto sm:gap-2 sm:px-3"
              >
                <Link
                  href="/vehicles/new"
                  aria-label="Add vehicle"
                  title="Add vehicle"
                >
                  <VaahanIcon name="plus" size={16} aria-hidden="true" />
                  <span className="hidden sm:inline">Add vehicle</span>
                </Link>
              </Button>
            ) : null}

            {/* Notification Bell */}
            <Button
              asChild
              variant="outline"
              size="icon"
              className="relative size-9 shrink-0 bg-card text-muted-foreground hover:border-[#a9583e] hover:text-[#a9583e]"
            >
              <Link
                href="/notifications"
                aria-label={`Notifications${unreadNotificationCount > 0 ? `, ${unreadNotificationCount} unread` : ""}`}
                title="Notifications"
              >
                <VaahanIcon name="notification" size={16} aria-hidden="true" />
                {unreadNotificationCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#a9583e] px-1 font-mono text-[9px] font-bold text-white"
                  >
                    {unreadNotificationCount > 99
                      ? "99+"
                      : unreadNotificationCount}
                  </span>
                )}
              </Link>
            </Button>
          </div>
        </header>

        {/* Dynamic Page Content inside Inset Canvas */}
        <div
          id="main-app-content"
          className="flex-1 p-4 sm:p-6 lg:p-8 w-full min-w-0 max-w-full pb-20 md:pb-8 overflow-x-clip print:p-0 print:m-0"
        >
          {serviceUnavailable && (
            <div
              role="alert"
              className="mb-6 border-l-2 border-[#a9583e] bg-[#f1ece3] px-4 py-3 text-sm text-[#615f59]"
            >
              Some account information couldn't load. Please refresh to try
              again.
            </div>
          )}
          {(!phoneVerified || !googleVerified) && (
            <Alert
              role="status"
              className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 rounded-xl border border-[#d8d0c5] bg-[#faf9f5]/70 p-3.5 sm:px-4 sm:py-3 shadow-2xs"
            >
              <div className="flex min-w-0 items-center gap-3 w-full sm:w-auto sm:flex-1">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f3e5da] text-[#a9583e]">
                  <VaahanIcon
                    name={!phoneVerified ? "mobile" : "google"}
                    size={19}
                  />
                </span>
                <AlertDescription className="text-sm font-medium text-[#615f59] leading-snug break-words">
                  {!phoneVerified
                    ? "Add a verified mobile number when you're ready."
                    : "Connect Google for another way to sign in."}
                </AlertDescription>
              </div>
              <Button
                asChild
                variant="outline"
                className="h-10 sm:h-11 w-full sm:w-auto shrink-0 border-[#d8d0c5] bg-transparent text-[#a9583e] hover:bg-[#f3e5da]/40 hover:text-[#8e3f28] gap-1.5 font-medium transition-colors justify-center"
              >
                <Link
                  href={`/onboarding/verification?returnUrl=${encodeURIComponent(pathname)}`}
                >
                  <span>{!phoneVerified ? "Verify mobile" : "Connect Google"}</span>
                  <VaahanIcon name="arrow-right" size={15} />
                </Link>
              </Button>
            </Alert>
          )}
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
