"use client";

import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import type { AdminNavigationSection } from "./navigation-model";
import { AdminSidebarItem } from "./AdminSidebarItem";

export interface AdminSidebarRootProps {
  sections: AdminNavigationSection[];
  activeModuleKey: string;
  activeSectionId: string | null;
  onSelectSection: (sectionId: string) => void;
  registerSectionRef: (sectionId: string, el: HTMLButtonElement | null) => void;
  onNavigate?: () => void;
  collapsed?: boolean;
}

export function AdminSidebarRoot({
  sections,
  activeModuleKey,
  activeSectionId,
  onSelectSection,
  registerSectionRef,
  onNavigate,
  collapsed,
}: AdminSidebarRootProps) {
  return (
    <div className="admin-nav-root-view">
      {/* Level 1: Overview direct link */}
      <div className="admin-nav-root-group">
        <AdminSidebarItem
          moduleKey="dashboard"
          label="Overview"
          icon="dashboard"
          isActive={activeModuleKey === "dashboard"}
          onClick={onNavigate}
          collapsed={collapsed}
        />
      </div>

      {/* Level 1: Primary domain sections */}
      <div className="admin-nav-root-sections">
        {!collapsed && (
          <p className="admin-nav-subhead">Administrative areas</p>
        )}
        {sections.map((section) => {
          const isCurrentSection = activeSectionId === section.id;
          return (
            <button
              key={section.id}
              ref={(el) => registerSectionRef(section.id, el)}
              type="button"
              className={`admin-nav-section-trigger ${isCurrentSection ? "is-contextual-active" : ""}`}
              onClick={() => onSelectSection(section.id)}
              aria-haspopup="true"
              aria-label={`Open ${section.label} navigation`}
              title={collapsed ? section.label : undefined}
            >
              <VaahanIcon name={section.icon} size={15} />
              {!collapsed && (
                <>
                  <span className="admin-nav-text">{section.label}</span>
                  <VaahanIcon
                    name="chevron-right"
                    size={12}
                    className="admin-nav-drilldown-chevron"
                  />
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Level 1: Quick search link */}
      {!collapsed && (
        <div className="admin-nav-root-search">
          <Link
            href="/search"
            onClick={onNavigate}
            className={`admin-nav-link admin-nav-search-link ${activeModuleKey === "search" ? "active" : ""}`}
          >
            <VaahanIcon name="search" size={14} />
            <span className="admin-nav-text">Global Search</span>
            <kbd className="admin-nav-shortcut">Ctrl K</kbd>
          </Link>
        </div>
      )}
    </div>
  );
}
