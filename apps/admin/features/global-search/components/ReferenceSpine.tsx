"use client";

import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type { ReferenceSpineNode, SearchScope } from "../search.types";

interface ReferenceSpineProps {
  spine: ReferenceSpineNode;
  onInspectNode: (node: {
    type: SearchScope;
    id: string;
    reference: string;
    label: string;
  }) => void;
}

export function ReferenceSpine({ spine, onInspectNode }: ReferenceSpineProps) {
  return (
    <div className="reference-spine-container" aria-label="Operational Reference Spine">
      <div className="reference-spine-title">
        Connected Entity Graph · Reference Spine
      </div>

      <div className="reference-spine-tree">
        {/* Root Node */}
        <div className="reference-spine-root">
          <VaahanIcon name="qr" size={14} />
          <span>{spine.label}</span>
          <code style={{ fontSize: 13 }}>{spine.reference}</code>
          {spine.status && (
            <span
              className={`admin-tag ${spine.status === "ACTIVATED" || spine.status === "ACTIVE" ? "success" : ""}`}
              style={{ padding: "1px 6px", fontSize: 10.5 }}
            >
              {spine.status}
            </span>
          )}
        </div>

        {/* Branches */}
        {spine.children && spine.children.length > 0 && (
          <div className="reference-spine-branches">
            {spine.children.map((child) => (
              <button
                key={child.id}
                type="button"
                className="reference-spine-branch-item"
                onClick={() =>
                  onInspectNode({
                    type: child.type,
                    id: child.id,
                    reference: child.reference,
                    label: child.label,
                  })
                }
                title={`Inspect connected ${child.label}`}
              >
                <VaahanIcon
                  name={
                    child.type === "vehicle"
                      ? "vehicle"
                      : child.type === "batch"
                      ? "layers"
                      : child.type === "customer"
                      ? "users"
                      : child.type === "order"
                      ? "file"
                      : child.type === "shipment"
                      ? "route"
                      : "help"
                  }
                  size={13}
                  style={{ color: "#616e5a" }}
                />
                <span className="spine-branch-label">{child.label}</span>
                <span className="spine-branch-ref">{child.reference}</span>
                {child.status && (
                  <span
                    className={`admin-tag ${
                      child.status === "ACTIVE" || child.status === "PAID"
                        ? "success"
                        : ""
                    }`}
                    style={{ padding: "1px 5px", fontSize: 10 }}
                  >
                    {child.status}
                  </span>
                )}
                {child.meta && (
                  <span className="spine-branch-meta">{child.meta}</span>
                )}
                <VaahanIcon
                  name="chevron-right"
                  size={12}
                  style={{ color: "#8c9684", marginLeft: "auto" }}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
