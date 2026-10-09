"use client";

import Link from "next/link";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import { useAdminRouteProgress } from "../loading";

export interface AdminSidebarItemProps {
  moduleKey: string;
  label: string;
  icon: VaahanIconName;
  isActive: boolean;
  onClick?: () => void;
  collapsed?: boolean;
}

export function AdminSidebarItem({
  moduleKey,
  label,
  icon,
  isActive,
  onClick,
  collapsed,
}: AdminSidebarItemProps) {
  const { isNavigating, pendingPathname, startNavigation } =
    useAdminRouteProgress();
  const href = moduleKey === "dashboard" ? "/" : `/${moduleKey}`;
  const isPending =
    isNavigating &&
    !isActive &&
    (pendingPathname === href ||
      (href !== "/" && pendingPathname?.startsWith(href)));

  const handleClick = () => {
    if (!isActive) {
      startNavigation(href);
    }
    onClick?.();
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      title={collapsed ? label : undefined}
      className={`admin-nav-link ${isActive ? "active" : ""} ${isPending ? "is-pending" : ""}`}
      aria-current={isActive ? "page" : undefined}
    >
      <VaahanIcon name={icon} size={15} />
      {!collapsed && <span className="admin-nav-text">{label}</span>}
    </Link>
  );
}

