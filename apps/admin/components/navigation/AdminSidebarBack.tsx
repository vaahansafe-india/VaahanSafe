"use client";

import React, { forwardRef } from "react";
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
          title={`Back to main navigation (${sectionLabel})`}
        >
          <VaahanIcon
            name="chevron-left"
            size={16}
            className="admin-nav-back-icon"
          />
          <span className="admin-nav-back-label">Back</span>
        </button>
        <span className="admin-nav-section-title">{sectionLabel}</span>
      </div>
    );
  },
);
