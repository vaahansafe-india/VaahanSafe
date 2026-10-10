"use client";

import React from "react";
import Link from "next/link";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import { toast } from "@vaahansafe/ui/components/sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@vaahansafe/ui/components/dropdown-menu";
import type { GlobalSearchResult } from "../search.types";

interface SearchResultRowProps {
  result: GlobalSearchResult;
  onInspect: (result: GlobalSearchResult) => void;
}

const ENTITY_ICONS: Record<string, VaahanIconName> = {
  qr: "qr",
  vehicle: "vehicle",
  customer: "users",
  order: "file",
  batch: "layers",
  transfer: "route",
  partner: "globe",
  shipment: "route",
  support: "help",
};

export function SearchResultRow({ result, onInspect }: SearchResultRowProps) {
  const icon = ENTITY_ICONS[result.entityType] || "file";

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    void navigator.clipboard.writeText(result.reference);
    toast.success("Reference copied", { description: result.reference });
  };

  return (
    <article className="result-row" onClick={() => onInspect(result)}>
      {/* WHAT: Canonical identifier & type */}
      <div className="result-ref-col">
        <button
          type="button"
          className="result-ref-link"
          onClick={(e) => {
            e.stopPropagation();
            onInspect(result);
          }}
          style={{ background: "none", border: "none", padding: 0, textAlign: "left" }}
        >
          {result.reference}
        </button>
        <span className="result-type-tag">
          {result.title !== result.reference ? result.title : result.entityType.toUpperCase()}
        </span>
      </div>

      {/* STATUS: State tag */}
      <div className="result-status-col">
        <span
          className={`admin-tag ${
            result.statusSeverity === "success"
              ? "success"
              : result.statusSeverity === "error"
              ? "error"
              : result.statusSeverity === "warning"
              ? "warning"
              : ""
          }`}
        >
          {result.status}
        </span>
      </div>

      {/* CONTEXT: Secondary relation or detail */}
      <div className="result-context-col" title={result.subtitle || ""}>
        {result.subtitle || "—"}
      </div>

      {/* LAST ACTIVITY: Date or time */}
      <div className="result-activity-col">
        {new Date(result.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        })}
      </div>

      {/* ACTIONS: Inspect & Dropdown */}
      <div className="result-actions-col" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="result-inspect-btn"
          onClick={() => onInspect(result)}
        >
          Inspect
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="admin-icon-button"
              style={{ width: 28, height: 28, padding: 0 }}
              aria-label="Actions"
            >
              <VaahanIcon name="more-horizontal" size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs">
            <DropdownMenuItem onClick={() => onInspect(result)}>
              <VaahanIcon name="eye" size={13} className="mr-2" />
              Inspect record preview
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={result.href}>
                <VaahanIcon name="external-link" size={13} className="mr-2" />
                Open full workspace
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCopy}>
              <VaahanIcon name="copy" size={13} className="mr-2" />
              Copy reference
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  );
}
