"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@vaahansafe/ui/components/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@vaahansafe/ui/components/sheet";
import { ADMIN_MODULES, canReadModule } from "../lib/modules";
import type { AdminIdentity } from "../lib/contracts";
import { AdminSidebar } from "./navigation";
import { useAdminRouteProgress, AdminPageTransition } from "./loading";

import { CommandPalette } from "./CommandPalette";

export function AdminShell({
  identity,
  children,
}: {
  identity: AdminIdentity;
  children: React.ReactNode;
}) {
  const pathname = usePathname(),
    router = useRouter();
  const { isNavigating } = useAdminRouteProgress();
  const current =
    ADMIN_MODULES.find((m) => m.key === pathname.split("/")[1]) ||
    ADMIN_MODULES[0]!;
  const [open, setOpen] = useState(false),
    [collapsed, setCollapsed] = useState(false),
    [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const handleMedia = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        setOpen(false);
      }
    };
    handleMedia(mql);
    mql.addEventListener("change", handleMedia);
    return () => mql.removeEventListener("change", handleMedia);
  }, []);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, []);

  const initials = identity.name
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={`admin-shell admin-console ${collapsed ? "sidebar-compact" : ""}`}
    >
      <a className="admin-skip" href="#admin-main">
        Skip to workspace
      </a>
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <AdminSidebar
          identity={identity}
          pathname={pathname}
          collapsed={collapsed}
        />
      </aside>
      <div className="admin-workspace-main">
        <header className="admin-topbar">
          <div className="topbar-context">
            <button
              className="admin-icon-button desktop-menu"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setCollapsed((v) => !v)}
            >
              <VaahanIcon name="panel-left" size={18} />
            </button>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  className="admin-icon-button mobile-menu"
                  aria-label="Open navigation"
                >
                  <VaahanIcon name="menu" size={20} />
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="admin-mobile-navigation"
                aria-describedby={undefined}
              >
                <SheetTitle className="sr-only">Admin navigation</SheetTitle>
                <AdminSidebar
                  identity={identity}
                  pathname={pathname}
                  onNavigate={() => setOpen(false)}
                />
              </SheetContent>
            </Sheet>
            <nav aria-label="Breadcrumb" className="admin-breadcrumb">
              <Link href="/">Console</Link>
              <span>/</span>
              <strong>{current.label}</strong>
            </nav>
          </div>
          <div className="topbar-actions">
            <button
              type="button"
              className="admin-search-trigger"
              onClick={() => setCommandOpen(true)}
              aria-label="Search records"
              title="Quick command switcher (Ctrl K)"
            >
              <VaahanIcon name="search" size={16} />
              <span className="admin-search-trigger-text">Search records</span>
              <kbd>Ctrl K</kbd>
            </button>
            <a
              href="https://status.vaahansafe.com"
              target="_blank"
              rel="noreferrer"
              className="admin-icon-button"
              aria-label="Open service status"
              title="Service status"
            >
              <VaahanIcon name="activity" size={18} />
            </a>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="admin-account-trigger"
                  aria-label="Account menu"
                >
                  <span className="admin-avatar">{initials}</span>
                  <span className="admin-account-name">
                    {identity.name}
                    <small>
                      {identity.role.replaceAll("_", " ").toLowerCase()}
                    </small>
                  </span>
                  <VaahanIcon
                    name="chevron-down"
                    size={13}
                    className="admin-account-chevron"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={6}
                collisionPadding={8}
                className="admin-account-menu"
              >
                <DropdownMenuLabel>
                  <strong>{identity.name}</strong>
                  <small>{identity.email}</small>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {canReadModule(identity.role, "settings") && (
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <VaahanIcon name="settings" size={15} />
                      System settings
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={() => router.push("/search")}>
                  <VaahanIcon name="search" size={15} />
                  Search workspace
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action="/api/auth/logout" method="post">
                  <button type="submit" className="admin-account-signout">
                    <VaahanIcon name="logout" size={15} />
                    Sign out
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main
          id="admin-main"
          className="admin-main"
          aria-busy={isNavigating}
        >
          <AdminPageTransition key={pathname}>
            {children}
          </AdminPageTransition>
        </main>
        <footer className="admin-footer">
          <span>VaahanSafe · Operations console</span>
          <span>Access controlled · Changes audited</span>
        </footer>
      </div>
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        identity={identity}
      />
    </div>
  );
}
