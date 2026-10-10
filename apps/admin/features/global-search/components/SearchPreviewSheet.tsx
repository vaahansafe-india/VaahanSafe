"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@vaahansafe/ui/components/sheet";
import { Skeleton } from "@vaahansafe/ui/components/skeleton";
import type { EntityPreviewData, SearchScope } from "../search.types";

interface SearchPreviewSheetProps {
  selectedEntity: {
    type: SearchScope;
    id: string;
    reference: string;
    title?: string;
  } | null;
  onClose: () => void;
  onPivotRelation: (relation: {
    type: SearchScope;
    id: string;
    reference: string;
    label: string;
  }) => void;
}

export function SearchPreviewSheet({
  selectedEntity,
  onClose,
  onPivotRelation,
}: SearchPreviewSheetProps) {
  const [data, setData] = useState<EntityPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedEntity) {
      setData(null);
      return;
    }

    let isCurrent = true;
    setLoading(true);
    setError(null);

    const controller = new AbortController();

    fetch(
      `/api/search/preview?type=${encodeURIComponent(
        selectedEntity.type
      )}&id=${encodeURIComponent(selectedEntity.id)}`,
      { signal: controller.signal }
    )
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error?.message || "Failed to load preview details.");
        }
        return json.data as EntityPreviewData;
      })
      .then((preview) => {
        if (isCurrent) {
          setData(preview);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isCurrent && err.name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Error loading preview");
          setLoading(false);
        }
      });

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [selectedEntity]);

  return (
    <Sheet open={!!selectedEntity} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="search-preview-drawer"
        aria-describedby="preview-description"
      >
        <SheetHeader className="preview-header">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#8c9684", textTransform: "uppercase" }}>
              {selectedEntity?.type.toUpperCase()} PREVIEW
            </span>
            {data?.status && (
              <span
                className={`admin-tag ${
                  data.statusSeverity === "success"
                    ? "success"
                    : data.statusSeverity === "error"
                    ? "error"
                    : ""
                }`}
              >
                {data.status}
              </span>
            )}
          </div>

          <SheetTitle className="preview-title">
            {selectedEntity?.reference}
          </SheetTitle>
          <SheetDescription id="preview-description">
            Operational entity inspection and recorded connections.
          </SheetDescription>
        </SheetHeader>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {error && (
          <div className="admin-notice error" role="alert">
            <VaahanIcon name="alert" size={14} />
            <span>{error}</span>
          </div>
        )}

        {!loading && data && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Sections */}
            {data.sections.map((sec, i) => (
              <section key={i} className="preview-section">
                <span className="preview-section-title">{sec.heading}</span>
                <div className="preview-fields-grid">
                  {sec.fields.map((f, j) => (
                    <div key={j} className="preview-field">
                      <span className="preview-field-label">{f.label}</span>
                      <span
                        className={`preview-field-value ${f.isCode ? "code" : ""}`}
                      >
                        {f.value ?? "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {/* Related Entities */}
            {data.relatedEntities.length > 0 && (
              <section className="preview-section">
                <span className="preview-section-title">Connected Records</span>
                <div className="preview-related-list">
                  {data.relatedEntities.map((rel) => (
                    <button
                      key={`${rel.entityType}-${rel.id}`}
                      type="button"
                      className="preview-related-item"
                      onClick={() =>
                        onPivotRelation({
                          type: rel.entityType,
                          id: rel.id,
                          reference: rel.reference,
                          label: rel.label,
                        })
                      }
                      title={`Inspect connected ${rel.label}`}
                    >
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#8c9684", textTransform: "uppercase" }}>
                          {rel.label}
                        </div>
                        <div style={{ fontWeight: 600, fontFamily: "AdminMono, monospace", fontSize: 13, color: "#1b1c1a" }}>
                          {rel.reference}
                        </div>
                        {rel.meta && (
                          <div style={{ fontSize: 11, color: "#616e5a" }}>
                            {rel.meta}
                          </div>
                        )}
                      </div>
                      <VaahanIcon name="chevron-right" size={14} style={{ color: "#8c9684" }} />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Activity */}
            {data.activity && data.activity.length > 0 && (
              <section className="preview-section">
                <span className="preview-section-title">Recent Activity</span>
                <div className="timeline-list" style={{ marginLeft: 8 }}>
                  {data.activity.map((evt) => (
                    <div key={evt.id} className="timeline-entry">
                      <div className="timeline-node" />
                      <span className="timeline-entry-title">{evt.title}</span>
                      <span className="timeline-entry-desc">{evt.description}</span>
                      <span className="timeline-entry-time">{evt.timestamp}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Sticky Action Footer */}
            <div className="preview-footer-action">
              <Link
                href={data.href}
                className="admin-button primary"
                style={{ width: "100%", justifyContent: "center" }}
              >
                <VaahanIcon name="external-link" size={14} />
                <span>Open full record in workspace</span>
              </Link>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
