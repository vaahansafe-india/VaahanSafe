"use client";

import React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { toast } from "@vaahansafe/ui/components/sonner";
import type { ExactMatchData, SearchScope } from "../search.types";
import { ReferenceSpine } from "./ReferenceSpine";

interface ExactMatchWorkspaceProps {
  exactMatch: ExactMatchData;
  onInspectNode: (node: {
    type: SearchScope;
    id: string;
    reference: string;
    label: string;
  }) => void;
}

export function ExactMatchWorkspace({
  exactMatch,
  onInspectNode,
}: ExactMatchWorkspaceProps) {
  const { primaryResult, lens, spine, timeline } = exactMatch;

  const handleCopy = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Reference copied to clipboard", {
      description: text,
    });
  };

  return (
    <div className="exact-match-workspace" aria-label="Exact Match Workspace">
      {/* Header */}
      <div className="exact-match-header">
        <div>
          <div className="exact-match-eyebrow">
            Exact Match · Canonical Operational Reference
          </div>
          <h2 className="exact-match-title">
            {primaryResult.reference}
          </h2>
          <div className="exact-match-subtitle">
            {lens.identity.label} · {lens.identity.type}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span
            className={`admin-tag ${
              lens.state.status === "ACTIVATED" || lens.state.status === "PAID" || lens.state.status === "ACTIVE"
                ? "success"
                : lens.state.status === "BLOCKED" || lens.state.status === "FAILED"
                ? "error"
                : ""
            }`}
          >
            {lens.state.status}
          </span>

          <button
            type="button"
            className="admin-icon-button"
            onClick={() => handleCopy(primaryResult.reference)}
            title="Copy reference code"
          >
            <VaahanIcon name="copy" size={14} />
          </button>

          <Link
            href={primaryResult.href}
            className="admin-button secondary"
            style={{ height: 32, padding: "0 12px", fontSize: 12 }}
          >
            <VaahanIcon name="external-link" size={13} />
            <span>Open record</span>
          </Link>
        </div>
      </div>

      {/* 2x2 Operational Lens */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#8c9684", textTransform: "uppercase", marginBottom: 6 }}>
          Operational Lens
        </div>
        <div className="operational-lens-grid">
          {/* Quadrant 1: Identity */}
          <div className="lens-quadrant">
            <span className="lens-quadrant-title">Identity</span>
            <span className="lens-quadrant-primary">{lens.identity.label}</span>
            <span className="lens-quadrant-secondary">
              <code>{lens.identity.reference}</code>
              <br />
              Created: {lens.identity.createdAt}
              {lens.identity.subLabel && ` · ${lens.identity.subLabel}`}
            </span>
          </div>

          {/* Quadrant 2: State */}
          <div className="lens-quadrant">
            <span className="lens-quadrant-title">State</span>
            <span className="lens-quadrant-primary">{lens.state.lifecycle}</span>
            <span className="lens-quadrant-secondary">
              Custody: {lens.state.custody}
              {lens.state.alert && (
                <>
                  <br />
                  <strong style={{ color: "#a04020" }}>{lens.state.alert}</strong>
                </>
              )}
            </span>
          </div>

          {/* Quadrant 3: Relationships */}
          <div className="lens-quadrant">
            <span className="lens-quadrant-title">Relationships</span>
            <span className="lens-quadrant-primary">
              {spine.children?.length || 0} Connected Records
            </span>
            <span className="lens-quadrant-secondary">
              {lens.relationships.vehicle && `Vehicle: ${lens.relationships.vehicle.reference}`}
              {lens.relationships.customer && ` · Owner: ${lens.relationships.customer.label}`}
              {lens.relationships.order && ` · Order: ${lens.relationships.order.reference}`}
              {lens.relationships.scans && ` · ${lens.relationships.scans.total} scans`}
            </span>
          </div>

          {/* Quadrant 4: Activity */}
          <div className="lens-quadrant">
            <span className="lens-quadrant-title">Activity</span>
            <span className="lens-quadrant-primary">
              {lens.activity.lastActivityTimestamp}
            </span>
            <span className="lens-quadrant-secondary">
              {lens.activity.lastActivityLabel}
              <br />
              {lens.activity.totalEvents} recorded events in ledger
            </span>
          </div>
        </div>
      </div>

      {/* Reference Spine */}
      <ReferenceSpine spine={spine} onInspectNode={onInspectNode} />

      {/* Unified Activity Timeline */}
      {timeline && timeline.length > 0 && (
        <div className="unified-timeline">
          <div className="unified-timeline-title">
            Unified Activity Timeline
          </div>
          <div className="timeline-list">
            {timeline.map((evt) => (
              <div
                key={evt.id}
                className={`timeline-entry ${evt.severity || "default"}`}
              >
                <div className="timeline-node" />
                <span className="timeline-entry-title">{evt.title}</span>
                <span className="timeline-entry-desc">{evt.description}</span>
                <span className="timeline-entry-time">{evt.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
