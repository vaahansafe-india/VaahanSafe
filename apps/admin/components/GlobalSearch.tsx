"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import type { AdminRow } from "../lib/contracts";
import { RecordTable } from "./RecordTable";
interface Result {
  key: string;
  label: string;
  rows: AdminRow[];
  unavailable: boolean;
}
export function GlobalSearch({ phoneAllowed }: { phoneAllowed: boolean }) {
  const [q, setQ] = useState(""),
    [phone, setPhone] = useState(false),
    [groups, setGroups] = useState<Result[] | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const version = useRef(0);
  async function search() {
    const current = ++version.current;
    setBusy(true);
    setError("");
    setGroups(null);
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q, phone }),
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error?.message ||
            "We couldn't complete this search. Please try again.",
        );
      if (current === version.current) setGroups(result.data);
    } catch (e) {
      if (current === version.current)
        setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      if (current === version.current) setBusy(false);
    }
  }
  return (
    <>
      <form
        className="admin-search-page"
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <input
          aria-label="Workspace search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          maxLength={100}
          minLength={3}
          required
          autoComplete="off"
          placeholder={
            phone
              ? "Enter a complete Indian mobile number…"
              : "Enter a reference or normalized registration…"
          }
        />
        {phoneAllowed && (
          <select
            aria-label="Search mode"
            value={phone ? "phone" : "reference"}
            onChange={(e) => {
              setPhone(e.target.value === "phone");
              setGroups(null);
              setQ("");
            }}
          >
            <option value="reference">References</option>
            <option value="phone">Phone lookup</option>
          </select>
        )}
        <button className="admin-button primary" disabled={busy}>
          <VaahanIcon name="search" size={14} />
          {busy ? "Searching…" : "Search"}
        </button>
      </form>
      {error && (
        <div className="admin-notice error" role="alert">
          {error}
        </div>
      )}
      {!groups && !error && (
        <div className="admin-panel admin-empty">
          <VaahanIcon name="search" size={30} />
          <h3>
            {busy ? "Finding your records…" : "Find what needs your attention."}
          </h3>
          <p>
            Enter at least three characters. Phone lookups require a complete
            mobile number and are recorded in the audit trail.
          </p>
        </div>
      )}
      {groups?.map((group) => (
        <section className="admin-panel admin-group-results" key={group.key}>
          <div className="admin-panel-head">
            <h2>{group.label}</h2>
            <Link className="admin-link" href={`/${group.key}`}>
              Open workspace →
            </Link>
          </div>
          {group.unavailable ? (
            <div className="admin-empty">
              <p>
                These records are temporarily unavailable. Retry the search.
              </p>
            </div>
          ) : group.rows.length ? (
            <RecordTable
              rows={group.rows}
              fields={Object.keys(group.rows[0]!).slice(0, 6)}
            />
          ) : (
            <div className="admin-empty">
              <p>No matching records in this workspace.</p>
            </div>
          )}
        </section>
      ))}
    </>
  );
}
