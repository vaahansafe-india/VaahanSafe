"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { VaahanIcon } from "@vaahansafe/icons";
import { ADMIN_MODULES, canReadModule, type AdminGroup } from "../lib/modules";
import type { AdminIdentity } from "../lib/contracts";
export function AdminShell({
  identity,
  children,
}: {
  identity: AdminIdentity;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open]);
  const current =
    ADMIN_MODULES.find((m) => m.key === pathname.split("/")[1]) ||
    ADMIN_MODULES[0];
  const groups: AdminGroup[] = [
    "Workspace",
    "Operations",
    "Commerce / Customer",
    "Platform / Content",
  ];
  return (
    <div className="admin-shell">
      <a className="admin-skip" href="#admin-main">
        Skip to workspace
      </a>
      {open && (
        <button
          className="admin-backdrop"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <aside
        className={`admin-sidebar ${open ? "is-open" : ""}`}
        aria-label="Admin navigation"
      >
        <Link href="/" className="admin-brand">
          <span className="admin-brand-mark">
            <VaahanIcon name="qr" size={21} />
          </span>
          <span>
            vaahan<span className="brand-light">safe</span>
            <small>OPERATIONS CONSOLE</small>
          </span>
        </Link>
        <div className="admin-workspace">
          <span className="status-dot" />
          Platform workspace<span className="workspace-label">ADMIN</span>
        </div>
        <nav>
          {groups.map((group) => (
            <div className="admin-nav-group" key={group}>
              <p>{group}</p>
              {ADMIN_MODULES.filter(
                (m) => m.group === group && canReadModule(identity.role, m.key),
              ).map((m) => {
                const href = m.key === "dashboard" ? "/" : `/${m.key}`;
                const selected = m.key === current?.key;
                return (
                  <Link
                    key={m.key}
                    href={href}
                    className={
                      selected ? "admin-nav-link active" : "admin-nav-link"
                    }
                    aria-current={selected ? "page" : undefined}
                  >
                    <VaahanIcon name={m.icon} size={17} />
                    <span>{m.label}</span>
                    {selected && <span className="nav-selection" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <VaahanIcon name="eye-off" size={16} />
          <span>
            Private workspace<small>Access is recorded and controlled</small>
          </span>
        </div>
      </aside>
      <div className="admin-workspace-main">
        <header className="admin-topbar">
          <div className="topbar-context">
            <button
              className="admin-icon-button mobile-menu"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-label="Toggle navigation"
            >
              <VaahanIcon name="menu" size={20} />
            </button>
            <span>Workspace</span>
            <span className="breadcrumb-divider">/</span>
            <strong>{current?.label}</strong>
          </div>
          <div className="topbar-actions">
            <Link className="admin-search-trigger" href="/search">
              <VaahanIcon name="search" size={17} />
              <span>Search workspace</span>
              <kbd>⌕</kbd>
            </Link>
            <span className="admin-avatar" aria-hidden="true">
              {identity.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="admin-user">
              <strong>{identity.name}</strong>
              <small>{identity.role.replaceAll("_", " ").toLowerCase()}</small>
            </div>
            <form action="/api/auth/logout" method="post">
              <button
                className="admin-icon-button"
                title="Sign out"
                aria-label="Sign out"
              >
                <VaahanIcon name="logout" size={17} />
              </button>
            </form>
          </div>
        </header>
        <main id="admin-main" className="admin-main">
          {children}
        </main>
        <footer className="admin-footer">
          <span>VaahanSafe · Operations & administration</span>
          <span>Private by design. Accountable by default.</span>
        </footer>
      </div>
    </div>
  );
}
