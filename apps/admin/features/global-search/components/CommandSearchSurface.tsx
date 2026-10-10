"use client";

import React, { useEffect, useRef } from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@vaahansafe/ui/components/select";
import type { QueryClassification, SearchScope } from "../search.types";
import { SEARCH_SCOPES } from "../search.types";

interface CommandSearchSurfaceProps {
  query: string;
  setQuery: (q: string) => void;
  scope: SearchScope;
  setScope: (s: SearchScope) => void;
  phoneAllowed: boolean;
  phoneMode: boolean;
  setPhoneMode: (p: boolean) => void;
  onSearch: (overrideQuery?: string, overrideScope?: SearchScope, overridePhone?: boolean) => void;
  busy: boolean;
  classification: QueryClassification;
}

const SCOPE_LABELS: Record<SearchScope, string> = {
  all: "All Domains",
  qr: "QR Identities",
  vehicle: "Vehicles",
  customer: "Customers",
  order: "Orders",
  batch: "Batches",
  partner: "Partners",
  transfer: "Transfers",
  shipment: "Shipments",
  support: "Support",
};

export function CommandSearchSurface({
  query,
  setQuery,
  scope,
  setScope,
  phoneAllowed,
  phoneMode,
  setPhoneMode,
  onSearch,
  busy,
  classification,
}: CommandSearchSurfaceProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: '/' focuses search input when not typing in another input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        const tagName = document.activeElement?.tagName.toLowerCase();
        if (tagName !== "input" && tagName !== "textarea") {
          e.preventDefault();
          inputRef.current?.focus();
          inputRef.current?.select();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 3) {
      onSearch();
    }
  };

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <form className="command-search-instrument" onSubmit={handleSubmit} role="search">
      <div className="command-search-row">
        <div className="command-search-input-wrap">
          <VaahanIcon name="search" size={15} className="command-search-icon" />

          <input
            ref={inputRef}
            className="command-search-input"
            aria-label="Operations search query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={100}
            autoComplete="off"
            spellCheck="false"
            placeholder={
              phoneMode
                ? "Enter a complete 10-digit Indian mobile number…"
                : "QR ID, vehicle registration, order, batch, customer, transfer…"
            }
          />

          {classification.hintBadge && (
            <span
              className={`command-shape-badge ${classification.isSensitivePhone ? "phone" : ""}`}
            >
              <VaahanIcon
                name={
                  classification.likelyScope === "phone"
                    ? "alert"
                    : classification.likelyScope === "qr"
                    ? "qr"
                    : classification.likelyScope === "vehicle"
                    ? "vehicle"
                    : "check"
                }
                size={11}
              />
              {classification.hintBadge}
            </span>
          )}

          {query.length > 0 && (
            <button
              type="button"
              className="admin-icon-button"
              style={{ width: 20, height: 20, padding: 0, flexShrink: 0 }}
              onClick={handleClear}
              aria-label="Clear query"
              title="Clear query"
            >
              <VaahanIcon name="close" size={11} />
            </button>
          )}
        </div>

        <div className="command-search-controls">
          {phoneAllowed && (
            <button
              type="button"
              className={`command-mode-btn ${phoneMode ? "phone" : ""}`}
              onClick={() => {
                const next = !phoneMode;
                setPhoneMode(next);
                if (next) {
                  setScope("customer");
                } else {
                  setScope("all");
                }
              }}
              title="Toggle audited phone lookup mode"
            >
              <VaahanIcon name="lock" size={11} />
              <span>{phoneMode ? "Audited Phone" : "Normal Mode"}</span>
            </button>
          )}

          {!phoneMode && (
            <Select
              value={scope}
              onValueChange={(val) => setScope(val as SearchScope)}
            >
              <SelectTrigger className="command-scope-trigger" aria-label="Search scope">
                <SelectValue placeholder="Scope" />
              </SelectTrigger>
              <SelectContent align="end">
                {SEARCH_SCOPES.map((sc) => (
                  <SelectItem key={sc} value={sc}>
                    {SCOPE_LABELS[sc]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <button
            type="submit"
            className="command-search-btn"
            disabled={busy || query.trim().length < 3}
          >
            {busy ? (
              <>
                <VaahanIcon name="refresh" size={13} className="animate-spin" />
                <span>Searching…</span>
              </>
            ) : (
              <>
                <VaahanIcon name="search" size={13} />
                <span>Search</span>
                <span className="command-kbd-hint">↵</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
