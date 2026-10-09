"use client";

import Link from "next/link";
import { VaahanSafeAppIcon } from "@vaahansafe/ui/brand";
import { VaahanIcon } from "@vaahansafe/icons";

export function AdminSidebarHeader({
  collapsed,
  onResetToRoot,
}: {
  collapsed?: boolean;
  onResetToRoot?: () => void;
}) {
  return (
    <div className="admin-brand-header">
      <Link
        href="/"
        className="admin-brand"
        onClick={onResetToRoot}
        title="VaahanSafe Operations Console"
        aria-label="VaahanSafe Operations Console"
      >
        <span className="admin-brand-applogo">
          <VaahanSafeAppIcon size={24} variant="dark" rounded="sm" bordered={false} />
        </span>
        {!collapsed && (
          <>
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
          </>
        )}
      </Link>
    </div>
  );
}
