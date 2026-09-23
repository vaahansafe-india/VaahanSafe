"use client"

import * as React from "react"
import Link from "next/link"
import {
  ChevronsUpDown,
  LogOut,
  Shield,
  User as UserIcon,
} from "lucide-react"

import { IdentityAvatar } from "@vaahansafe/ui"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

interface NavUserProps {
  user?: {
    name?: string
    email?: string
    phone?: string
    phoneVerified?: boolean
    avatar?: string
  }
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar()

  const displayName =
    user?.name?.trim() ||
    (user?.email ? user.email.split("@")[0] : undefined) ||
    (user?.phone ? (user.phone.startsWith("+91") ? `+91 ${user.phone.slice(-10)}` : user.phone) : "Vehicle Owner")


  const isVerified = user?.phoneVerified ?? Boolean(user?.phone)

  const maskedIdentifier = user?.phone
    ? (user.phone.length >= 4 ? `+91 ••••• ${user.phone.slice(-4)}` : user.phone)
    : user?.email
    ? user.email.replace(/(.{2})(.*)(?=@)/, (_m, g1) => g1 + "•••")
    : "Unverified"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={displayName}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border border-transparent hover:border-sidebar-border transition-all rounded-xl p-2 group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center"
            >
              {/* Deterministic VaahanSafe Identity Glyph Avatar */}
              <IdentityAvatar
                seed={user?.phone || user?.email || displayName}
                name={displayName}
                src={user?.avatar}
                isVerified={isVerified}
                size="sm"
                className="shrink-0"
              />

              <div className="grid flex-1 text-left text-xs leading-tight min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium text-sidebar-foreground">
                  {displayName}
                </span>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      isVerified ? "bg-[#5db8a6]" : "bg-[#e5a83b]"
                    }`}
                  />
                  <span className="truncate text-[9.5px]">{maskedIdentifier}</span>
                  <span
                    className={`shrink-0 rounded px-1 py-0.2 text-[7.5px] font-semibold uppercase tracking-wider ${
                      isVerified
                        ? "bg-[#5db8a6]/10 text-[#5db8a6] border border-[#5db8a6]/20"
                        : "bg-[#e5a83b]/10 text-[#e5a83b] border border-[#e5a83b]/20"
                    }`}
                  >
                    {isVerified ? "VERIFIED" : "PENDING"}
                  </span>
                </div>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-2xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={6}
          >
            <DropdownMenuLabel className="p-2 font-normal">
              <div className="flex items-center gap-3 text-left text-sm">
                <IdentityAvatar
                  seed={user?.phone || user?.email || displayName}
                  name={displayName}
                  src={user?.avatar}
                  isVerified={isVerified}
                  size="md"
                  className="shrink-0"
                />
                <div className="grid flex-1 text-left text-xs leading-tight">
                  <span className="truncate font-semibold text-popover-foreground">
                    {displayName}
                  </span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    {user?.email || maskedIdentifier}
                  </span>
                  <div className="mt-1 flex items-center gap-1">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isVerified ? "bg-[#5db8a6]" : "bg-[#e5a83b]"
                      }`}
                    />
                    <span
                      className={`font-mono text-[8.5px] font-semibold uppercase tracking-wider ${
                        isVerified ? "text-[#5db8a6]" : "text-[#e5a83b]"
                      }`}
                    >
                      {isVerified ? "Verified Identity" : "Verification Pending"}
                    </span>
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="focus:bg-accent focus:text-accent-foreground cursor-pointer">
                <Link href="/settings/profile" className="flex items-center gap-2">
                  <UserIcon className="size-4 text-[#cc785c]" />
                  <span>Profile Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="focus:bg-accent focus:text-accent-foreground cursor-pointer">
                <Link href="/settings/security" className="flex items-center gap-2">
                  <Shield className="size-4 text-muted-foreground" />
                  <span>Security & Sessions</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              onSelect={(e) => {
                const form = document.getElementById("nav-user-logout-form") as HTMLFormElement;
                if (form) {
                  form.submit();
                }
              }}
              className="focus:bg-destructive/10 focus:text-destructive text-destructive cursor-pointer"
            >
              <form id="nav-user-logout-form" action="/api/auth/logout" method="POST" className="w-full">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 py-0.5 text-xs font-medium"
                  onClick={(e) => {
                    e.currentTarget.form?.submit();
                  }}
                >
                  <LogOut className="size-3.5" />
                  <span>Sign out</span>
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
