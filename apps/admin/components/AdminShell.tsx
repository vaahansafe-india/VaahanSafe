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
import { ADMIN_MODULES, canReadModule, type AdminGroup } from "../lib/modules";
import type { AdminIdentity } from "../lib/contracts";
const groups: AdminGroup[] = [
  "Workspace",
  "Operations",
  "Commerce / Customer",
  "Platform / Content",
];
const groupLabels: Record<AdminGroup, string> = {
  Workspace: "Workspace",
  Operations: "QR operations",
  "Commerce / Customer": "Customers & commerce",
  "Platform / Content": "Platform & content",
};
export function AdminShell({
  identity,
  children,
}: {
  identity: AdminIdentity;
  children: React.ReactNode;
}) {
  const pathname = usePathname(),
    router = useRouter();
  const current =
    ADMIN_MODULES.find((m) => m.key === pathname.split("/")[1]) ||
    ADMIN_MODULES[0]!;
  const [open, setOpen] = useState(false),
    [collapsed, setCollapsed] = useState(false),
    [navSearch, setNavSearch] = useState("");
  const [expanded, setExpanded] = useState<string[]>([
    "Workspace",
    current.group,
  ]);
  useEffect(() => {
    setOpen(false);
    setExpanded((v) => (v.includes(current.group) ? v : [...v, current.group]));
  }, [pathname, current.group]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        router.push("/search");
      }
    };
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, [router]);
  const initials = identity.name
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const navigation = (
    <>
      <div className="admin-brand-header">
        <Link href="/" className="admin-brand" onClick={() => setOpen(false)}>
          <span className="admin-brand-mark">
            <VaahanIcon name="qr" size={13} />
          </span>
          <span className="admin-brand-slash">/</span>
          <span className="admin-brand-project-icon">
            <VaahanIcon name="database" size={13} />
          </span>
          <div className="admin-brand-meta">
            <span className="admin-brand-name">vaahansafe</span>
            <span className="admin-project-badge">OPS</span>
          </div>
          <VaahanIcon
            name="chevron-down"
            size={12}
            className="admin-brand-caret"
          />
        </Link>
      </div>
      <div className="admin-nav-filter">
        <VaahanIcon name="search" size={13} />
        <input
          aria-label="Find a workspace section"
          placeholder="Filter..."
          value={navSearch}
          onChange={(e) => setNavSearch(e.target.value)}
        />
        {navSearch ? (
          <button
            type="button"
            className="admin-nav-filter-clear"
            onClick={() => setNavSearch("")}
            aria-label="Clear filter"
          >
            <VaahanIcon name="close" size={11} />
          </button>
        ) : null}
      </div>
      <nav aria-label="Workspace sections">
        {groups.map((group) => {
          const modules = ADMIN_MODULES.filter(
            (m) =>
              m.group === group &&
              canReadModule(identity.role, m.key) &&
              m.label.toLowerCase().includes(navSearch.toLowerCase()),
          );
          if (!modules.length) return null;
          const isExpanded =
            collapsed || !!navSearch || expanded.includes(group);
          return (
            <section className="admin-nav-group" key={group}>
              <button
                type="button"
                className="admin-nav-heading"
                aria-expanded={isExpanded}
                onClick={() =>
                  setExpanded((v) =>
                    v.includes(group)
                      ? v.filter((g) => g !== group)
                      : [...v, group],
                  )
                }
              >
                <span>{groupLabels[group]}</span>
                <VaahanIcon
                  name="chevron-down"
                  size={11}
                  className={`admin-nav-chevron ${isExpanded ? "is-expanded" : "is-collapsed"}`}
                />
              </button>
              {isExpanded && (
                <div className="admin-nav-list">
                  {modules.map((m) => {
                    const isActive = m.key === current.key;
                    return (
                      <Link
                        key={m.key}
                        href={m.key === "dashboard" ? "/" : `/${m.key}`}
                        onClick={() => setOpen(false)}
                        title={collapsed ? m.label : undefined}
                        className={`admin-nav-link ${isActive ? "active" : ""}`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <VaahanIcon name={m.icon} size={15} />
                        <span className="admin-nav-text">{m.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
        {navSearch &&
          !ADMIN_MODULES.some(
            (m) =>
              canReadModule(identity.role, m.key) &&
              m.label.toLowerCase().includes(navSearch.toLowerCase()),
          ) && <p className="admin-nav-empty">No matching section.</p>}
      </nav>
      <div className="admin-sidebar-foot">
        <span className="admin-avatar">{initials}</span>
        <span>
          <strong>{identity.name}</strong>
          <small>{identity.role.replaceAll("_", " ").toLowerCase()}</small>
        </span>
        <VaahanIcon name="shield" size={13} />
      </div>
    </>
  );
  return (
    <div
      className={`admin-shell admin-console ${collapsed ? "sidebar-compact" : ""}`}
    >
      <a className="admin-skip" href="#admin-main">
        Skip to workspace
      </a>
      <aside className="admin-sidebar" aria-label="Admin navigation">
        {navigation}
      </aside>
      <div className="admin-workspace-main">
        <header className="admin-topbar">
          <div className="topbar-context">
            <button
              className="admin-icon-button desktop-menu"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              onClick={() => setCollapsed((v) => !v)}
            >
              <VaahanIcon name="menu" size={19} />
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
                {navigation}
              </SheetContent>
            </Sheet>
            <nav aria-label="Breadcrumb" className="admin-breadcrumb">
              <Link href="/">Console</Link>
              <span>/</span>
              <strong>{current.label}</strong>
            </nav>
          </div>
          <div className="topbar-actions">
            <Link className="admin-search-trigger" href="/search">
              <VaahanIcon name="search" size={16} />
              <span>Search records</span>
              <kbd>Ctrl K</kbd>
            </Link>
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
                  <VaahanIcon name="chevron-down" size={13} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="admin-account-menu">
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
        <main id="admin-main" className="admin-main">
          {children}
        </main>
        <footer className="admin-footer">
          <span>VaahanSafe · Operations console</span>
          <span>Access controlled · Changes audited</span>
        </footer>
      </div>
    </div>
  );
}
