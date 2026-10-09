"use client";

import { VaahanIcon } from "@vaahansafe/icons";
import type { AdminIdentity } from "../../lib/contracts";

export function AdminSidebarFooter({
  identity,
  collapsed,
}: {
  identity: AdminIdentity;
  collapsed?: boolean;
}) {
  const initials = identity.name
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="admin-sidebar-foot">
      <span className="admin-avatar">{initials}</span>
      {!collapsed && (
        <>
          <span>
            <strong>{identity.name}</strong>
            <small>{identity.role.replaceAll("_", " ").toLowerCase()}</small>
          </span>
          <VaahanIcon name="shield" size={13} />
        </>
      )}
    </div>
  );
}
