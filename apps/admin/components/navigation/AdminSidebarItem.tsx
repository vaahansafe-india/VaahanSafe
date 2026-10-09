"use client";

import Link from "next/link";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";

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
  const href = moduleKey === "dashboard" ? "/" : `/${moduleKey}`;
  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`admin-nav-link ${isActive ? "active" : ""}`}
      aria-current={isActive ? "page" : undefined}
    >
      <VaahanIcon name={icon} size={15} />
      {!collapsed && <span className="admin-nav-text">{label}</span>}
    </Link>
  );
}
