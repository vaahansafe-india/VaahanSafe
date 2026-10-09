"use client";

import { forwardRef } from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export interface AdminSidebarBackProps {
  onBack: () => void;
  sectionLabel: string;
}

export const AdminSidebarBack = forwardRef<HTMLButtonElement, AdminSidebarBackProps>(
  function AdminSidebarBack({ onBack, sectionLabel }, ref) {
    return (
      <div className="admin-nav-back-row">
        <button
          ref={ref}
          type="button"
          className="admin-nav-back-button"
          onClick={onBack}
          aria-label={`Back to main navigation from ${sectionLabel}`}
          title="Back to main navigation"
        >
          <VaahanIcon name="chevron-left" size={13} />
          <span>Back</span>
        </button>
        <span className="admin-nav-section-title">{sectionLabel}</span>
      </div>
    );
  },
);
