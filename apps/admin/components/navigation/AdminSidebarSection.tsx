"use client";

import { useEffect, useRef } from "react";
import { getAdminModule } from "../../lib/modules";
import type { AdminNavigationSection } from "./navigation-model";
import { AdminSidebarBack } from "./AdminSidebarBack";
import { AdminSidebarItem } from "./AdminSidebarItem";

export interface AdminSidebarSectionProps {
  section: AdminNavigationSection;
  activeModuleKey: string;
  onBack: () => void;
  onNavigate?: () => void;
  collapsed?: boolean;
}

export function AdminSidebarSection({
  section,
  activeModuleKey,
  onBack,
  onNavigate,
  collapsed,
}: AdminSidebarSectionProps) {
  const backButtonRef = useRef<HTMLButtonElement>(null);

  // Focus Back button upon entering Level 2 for keyboard accessibility
  useEffect(() => {
    backButtonRef.current?.focus();
  }, []);

  // Handle Escape key to return to Level 1
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onBack();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onBack]);

  return (
    <div className="admin-nav-section-view">
      {/* Level 2: Back button + Section title */}
      <AdminSidebarBack
        ref={backButtonRef}
        onBack={onBack}
        sectionLabel={section.label}
      />

      {/* Level 2: Sub-groups and module links */}
      <div className="admin-nav-section-groups">
        {section.groups.map((group, idx) => (
          <div key={group.label || idx} className="admin-nav-group">
            {group.label && !collapsed && (
              <p className="admin-nav-heading-static">{group.label}</p>
            )}
            <div className="admin-nav-list">
              {group.modules.map((modKey) => {
                const mod = getAdminModule(modKey);
                if (!mod) return null;
                const isActive = activeModuleKey === mod.key;
                return (
                  <AdminSidebarItem
                    key={mod.key}
                    moduleKey={mod.key}
                    label={mod.label}
                    icon={mod.icon}
                    isActive={isActive}
                    onClick={onNavigate}
                    collapsed={collapsed}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
