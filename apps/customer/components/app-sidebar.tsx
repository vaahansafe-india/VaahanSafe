"use client"

import * as React from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  Car,
  QrCode,
  CreditCard,
  Package,
  Wallet,
  PhoneCall,
  Activity,
  Bell,
  ShoppingCart,
  ScanLine,
  Smartphone,
  RotateCcw,
} from "lucide-react"

import { VaahanSafeLogo, VaahanSafeMark } from "@vaahansafe/ui/brand"
import { NavMain, type NavMainItem } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name?: string
    email?: string
    phone?: string
    phoneVerified?: boolean
    avatar?: string
  }
  vehicles?: Array<{
    id: string
    registrationNumber: string
    make: string
    model: string
  }>
}

const overviewNav: NavMainItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
]

const identityNav: NavMainItem[] = [
  {
    title: "Vehicles",
    url: "/vehicles",
    icon: Car,
  },
  {
    title: "My QR",
    url: "/qr",
    icon: QrCode,
    isLifecycleRail: true,
    items: [
      {
        title: "Overview",
        url: "/qr",
        index: "01",
      },
      {
        title: "Buy QR",
        url: "/qr/buy",
        badge: "Sticker",
        index: "02",
        groupLabel: "ACQUIRE",
      },
      {
        title: "Activate Retail QR",
        url: "/qr/activate",
        badge: "Retail",
        index: "03",
      },
      {
        title: "QR Codes",
        url: "/qr/codes",
        index: "04",
        groupLabel: "MANAGE",
      },
      {
        title: "Digital QR",
        url: "/qr/digital",
        badge: "Pass",
        index: "05",
      },
      {
        title: "Replace QR",
        url: "/qr/replace",
        index: "06",
        groupLabel: "SERVICE",
      },
    ],
  },
]

const servicesNav: NavMainItem[] = [
  {
    title: "Subscription",
    url: "/subscription",
    icon: CreditCard,
  },
  {
    title: "Orders",
    url: "/orders",
    icon: Package,
  },
  {
    title: "Payments",
    url: "/payments",
    icon: Wallet,
  },
  {
    title: "Emergency Contacts",
    url: "/emergency-contacts",
    icon: PhoneCall,
  },
]

const activityNav: NavMainItem[] = [
  {
    title: "Scan History",
    url: "/scan-history",
    icon: Activity,
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
  },
]

export function AppSidebar({ user, vehicles = [], ...props }: AppSidebarProps) {
  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
      {...props}
    >
      {/* 01. Brand Header — Fixed h-14 to align with top navbar */}
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-3.5 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:p-0">
        {/* Expanded state: Full logo and identity rail */}
        <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:hidden">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c] rounded-md"
          >
            <VaahanSafeLogo size="sm" variant="brand" showTagline={false} />
          </Link>
          <div className="flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
            <span>IDENTITY</span>
          </div>
        </div>

        {/* Collapsed icon state: Centered brand mark only */}
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center w-full h-full">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center size-8 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c] hover:bg-sidebar-accent transition-colors"
            aria-label="VaahanSafe Dashboard"
          >
            <VaahanSafeMark size={22} variant="brand" />
          </Link>
        </div>
      </SidebarHeader>

      {/* 02. Navigation Tiers */}
      <SidebarContent className="space-y-4 px-2 py-3 group-data-[collapsible=icon]:space-y-1 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2">
        <NavMain label="OVERVIEW" items={overviewNav} />
        <NavMain label="VEHICLE IDENTITY" items={identityNav} />
        <NavMain label="SERVICES" items={servicesNav} />
        <NavMain label="ACTIVITY" items={activityNav} />
      </SidebarContent>

      {/* 03. User Identity Footer (Dropdown Card) */}
      <SidebarFooter className="border-t border-sidebar-border p-2 bg-sidebar group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:py-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
        <NavUser user={user} />
      </SidebarFooter>

      {/* 04. Smooth Sidebar Rail for Desktop Expansion */}
      <SidebarRail />
    </Sidebar>
  )
}
