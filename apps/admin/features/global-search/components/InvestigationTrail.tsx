"use client";

import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type { InvestigationBreadcrumb } from "../search.types";

interface InvestigationTrailProps {
  trail: InvestigationBreadcrumb[];
  onSelectCrumb: (index: number) => void;
  onBack: () => void;
  onClearTrail: () => void;
}

export function InvestigationTrail({
  trail,
  onSelectCrumb,
  onBack,
  onClearTrail,
}: InvestigationTrailProps) {
  if (trail.length <= 1) return null;

  return (
    <nav className="investigation-trail" aria-label="Investigation breadcrumb">
      <div className="trail-crumbs">
        <span style={{ fontWeight: 700, color: "#8c9684", textTransform: "uppercase", fontSize: 10.5 }}>
          Investigation:
        </span>

        {trail.map((item, index) => {
          const isLast = index === trail.length - 1;
          return (
            <React.Fragment key={`${item.entityType}-${item.id}-${index}`}>
              {index > 0 && <span className="trail-separator">/</span>}
              <button
                type="button"
                className={`trail-item ${isLast ? "current" : ""}`}
                onClick={() => onSelectCrumb(index)}
                disabled={isLast}
              >
                <span>{item.title}</span>
                <code style={{ fontSize: 11 }}>{item.reference}</code>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          className="trail-back-btn"
          onClick={onBack}
          title="Back to previous entity"
        >
          <VaahanIcon name="chevron-left" size={13} />
          <span>Back</span>
        </button>

        <button
          type="button"
          className="admin-icon-button"
          style={{ width: 22, height: 22, padding: 0 }}
          onClick={onClearTrail}
          title="Reset trail to primary match"
        >
          <VaahanIcon name="close" size={11} />
        </button>
      </div>
    </nav>
  );
}
