"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@vaahansafe/ui/lib/utils"

export interface NavSubItem {
  title: string
  url: string
  isActive?: boolean
  badge?: string
  index?: string
  groupLabel?: string
}

export interface NavMainItem {
  title: string
  url: string
  icon?: LucideIcon | React.ComponentType<{ className?: string }>
  isActive?: boolean
  badge?: string
  isLifecycleRail?: boolean
  items?: NavSubItem[]
}

export function NavMain({
  label,
  items,
}: {
  label?: string
  items: NavMainItem[]
}) {
  const pathname = usePathname()
  const { state, isMobile } = useSidebar()
  const isIconMode = state === "collapsed" && !isMobile

  return (
    <SidebarGroup className="p-1">
      {label && (
        <SidebarGroupLabel className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground px-2.5 h-6 group-data-[collapsible=icon]:hidden">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarMenu className="gap-0.5">
        {items.map((item) => {
          const hasChildren = Boolean(item.items && item.items.length > 0)
          const isItemActive = Boolean(
            pathname &&
              (pathname === item.url ||
                item.items?.some(
                  (sub) =>
                    pathname === sub.url || pathname.startsWith(`${sub.url}/`)
                ))
          )

          // 01. Collapsed Desktop Icon Mode: Pure centered icons with tooltips
          if (isIconMode) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isItemActive}
                  className={cn(
                    "!size-8 !p-0 mx-auto justify-center items-center rounded-md transition-colors",
                    isItemActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Link
                    href={item.url}
                    className="flex size-8 items-center justify-center"
                  >
                    {item.icon && (
                      <item.icon
                        className={cn(
                          "size-4 shrink-0 transition-colors",
                          isItemActive
                            ? "text-[#cc785c]"
                            : "text-muted-foreground group-hover/menu-item:text-sidebar-foreground"
                        )}
                      />
                    )}
                    <span className="sr-only">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          // 02. Expanded Mode: Items with Sub-Routes (Canonical Shadcn Accordion)
          if (hasChildren) {
            return (
              <Collapsible
                key={item.title}
                defaultOpen={isItemActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isItemActive}
                      className={cn(
                        "h-8 text-[13px] font-medium transition-colors cursor-pointer w-full flex items-center gap-2.5 px-2.5 rounded-md",
                        isItemActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-xs"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      {item.icon && (
                        <item.icon
                          className={cn(
                            "size-4 shrink-0 transition-colors",
                            isItemActive
                              ? "text-[#cc785c]"
                              : "text-muted-foreground group-hover/menu-item:text-sidebar-foreground"
                          )}
                        />
                      )}
                      <span className="truncate">{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto rounded bg-[#cc785c]/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#cc785c]">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight
                        className={cn(
                          "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90",
                          item.badge ? "ml-1.5" : "ml-auto"
                        )}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {item.isLifecycleRail ? (
                      <div className="relative pl-3.5 pr-1 py-1.5 my-0.5 space-y-1">
                        {/* Continuous Vertical Lifecycle Rail */}
                        <div
                          className="absolute left-[26px] -translate-x-1/2 top-3 bottom-3 w-[1.5px] bg-sidebar-border"
                          aria-hidden="true"
                        />

                        {item.items?.map((subItem) => {
                          const isSubActive = pathname === subItem.url

                          return (
                            <React.Fragment key={subItem.title}>
                              {subItem.groupLabel && (
                                <div className="font-mono text-[8.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70 pt-2 pb-0.5 px-6">
                                  {subItem.groupLabel}
                                </div>
                              )}
                              <Link
                                href={subItem.url}
                                className={cn(
                                  "group/rail-item relative flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-all text-xs border",
                                  isSubActive
                                    ? "bg-sidebar-accent/80 text-sidebar-foreground font-semibold shadow-2xs border-sidebar-border/40"
                                    : "border-transparent text-muted-foreground hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                                )}
                              >
                                {/* Lifecycle Node Dot */}
                                <span
                                  className={cn(
                                    "relative z-10 size-2 rounded-full transition-all shrink-0",
                                    isSubActive
                                      ? "bg-[#cc785c] ring-3 ring-[#cc785c]/25 scale-110"
                                      : "border border-sidebar-border bg-sidebar group-hover/rail-item:border-[#cc785c]/60 group-hover/rail-item:bg-[#cc785c]/20"
                                  )}
                                  aria-hidden="true"
                                />

                                {/* Step Index */}
                                {subItem.index && (
                                  <span
                                    className={cn(
                                      "font-mono text-[10px]",
                                      isSubActive
                                        ? "text-[#cc785c] font-bold"
                                        : "text-muted-foreground/70"
                                    )}
                                  >
                                    {subItem.index}
                                  </span>
                                )}

                                {/* Title */}
                                <span className="truncate flex-1">
                                  {subItem.title}
                                </span>

                                {/* Badge */}
                                {subItem.badge && (
                                  <span
                                    className={cn(
                                      "rounded px-1.5 py-0.5 font-mono text-[8.5px] font-semibold uppercase tracking-wider",
                                      isSubActive
                                        ? "bg-[#cc785c]/20 text-[#cc785c]"
                                        : "bg-muted text-muted-foreground group-hover/rail-item:text-foreground"
                                    )}
                                  >
                                    {subItem.badge}
                                  </span>
                                )}
                              </Link>
                            </React.Fragment>
                          )
                        })}
                      </div>
                    ) : (
                      <SidebarMenuSub className="border-l border-sidebar-border ml-3.5 pl-2.5 py-1 my-0.5 space-y-0.5">
                        {item.items?.map((subItem) => {
                          const isSubActive = pathname === subItem.url

                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isSubActive}
                                className={cn(
                                  "h-7 text-[12.5px] rounded-md px-2.5 transition-colors",
                                  isSubActive
                                    ? "bg-sidebar-accent font-medium text-[#cc785c]"
                                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                )}
                              >
                                <Link
                                  href={subItem.url}
                                  className="flex items-center justify-between w-full"
                                >
                                  <span className="truncate">{subItem.title}</span>
                                  {subItem.badge && (
                                    <span className="rounded bg-[#cc785c]/10 px-1 py-0.2 font-mono text-[8px] uppercase text-[#cc785c]">
                                      {subItem.badge}
                                    </span>
                                  )}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    )}
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )
          }

          // 03. Expanded Mode: Standard Single Destination Link
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isItemActive}
                className={cn(
                  "h-8 text-[13px] font-medium transition-colors w-full px-2.5 rounded-md",
                  isItemActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-xs"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Link
                  href={item.url}
                  className="flex items-center gap-2.5 w-full"
                >
                  {item.icon && (
                    <item.icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        isItemActive
                          ? "text-[#cc785c]"
                          : "text-muted-foreground group-hover/menu-item:text-sidebar-foreground"
                      )}
                    />
                  )}
                  <span className="truncate">{item.title}</span>
                  {item.badge && (
                    <span className="ml-auto rounded bg-[#cc785c]/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#cc785c]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
