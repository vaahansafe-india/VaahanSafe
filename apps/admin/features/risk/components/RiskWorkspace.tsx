"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@vaahansafe/ui/components/tabs";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@vaahansafe/ui/components/sheet";
import { VaahanIcon } from "@vaahansafe/icons";
import { getAdminData } from "../../../lib/client-api";
import { mutateNetwork } from "../../network/mutation";
import type { AdminIdentity } from "../../../lib/contracts";
import {
  EMPTY_RISK_FILTERS,
  riskLabel,
  type RiskFilters,
  type RiskSignal,
  type RiskSummary,
  type RiskPage,
  type RiskCase,
  type RiskPattern,
  type RiskPulse as Pulse,
} from "../risk.types";
import { parseRiskFilters, serializeRiskFilters } from "../risk.filters";
import {
  RiskBadge,
  RiskError,
  RiskSkeleton,
  SignalIdentity,
  Fingerprint,
  riskDate,
  riskKeys,
} from "./RiskShared";
import { RiskFilterFields, RiskFilterSheet } from "./RiskFilters";
import { RiskPulse } from "./RiskEvidence";
import { RiskInspect } from "./RiskDetail";
export function RiskWorkspace({
  identity,
  initialFilters,
  initialWorkspace = "signals",
  initialView = "grid",
  initial,
  initialSummary,
}: {
  identity: AdminIdentity;
  initialFilters: RiskFilters;
  initialWorkspace?: string;
  initialView?: string;
  initial: RiskPage<RiskSignal> | null;
  initialSummary: RiskSummary | null;
}) {
  const [f, setF] = useState(initialFilters),
    [search, setSearch] = useState(initialFilters.q),
    [workspace, setWorkspace] = useState(initialWorkspace),
    [view, setView] = useState(initialView),
    [inspect, setInspect] = useState<string | null>(null),
    [filtersOpen, setFiltersOpen] = useState(false),
    [exportMessage, setExportMessage] = useState(""),
    [exporting, setExporting] = useState(false);
  const client = useQueryClient(),
    filter = serializeRiskFilters(f),
    scope = riskKeys.scope(identity);
  useEffect(() => {
    const timer = setTimeout(
      () =>
        setF((v) => ({
          ...v,
          q: parseRiskFilters(new URLSearchParams({ q: search })).q,
        })),
      300,
    );
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    const p = new URLSearchParams(filter);
    p.set("workspace", workspace);
    p.set("view", view);
    window.history.replaceState(null, "", `/fraud?${p}`);
  }, [filter, workspace, view]);
  useEffect(() => {
    const pop = () => {
      const p = new URLSearchParams(window.location.search);
      const next = parseRiskFilters(p);
      setF(next);
      setSearch(next.q);
      setWorkspace(
        ["cases", "patterns"].includes(p.get("workspace") || "")
          ? p.get("workspace")!
          : "signals",
      );
      setView(p.get("view") === "rows" ? "rows" : "grid");
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  const signals = useInfiniteQuery({
    queryKey: riskKeys.list(identity, "signals", filter),
    queryFn: ({ pageParam, signal }) =>
      getAdminData<RiskPage<RiskSignal>>(
        `/api/risk/signals?${filter}${pageParam ? "&cursor=" + encodeURIComponent(pageParam) : ""}`,
        signal,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor || undefined,
    enabled: workspace === "signals",
    initialData:
      initial && filter === serializeRiskFilters(initialFilters)
        ? { pages: [initial], pageParams: [null] }
        : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30000,
  });
  const cases = useInfiniteQuery({
    queryKey: riskKeys.list(identity, "cases", filter),
    queryFn: ({ pageParam, signal }) =>
      getAdminData<RiskPage<RiskCase>>(
        `/api/risk/cases?${filter}${pageParam ? "&cursor=" + encodeURIComponent(pageParam) : ""}`,
        signal,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor || undefined,
    enabled: workspace === "cases",
    placeholderData: keepPreviousData,
    staleTime: 30000,
  });
  const summary = useQuery({
    queryKey: [...scope, "summary"],
    queryFn: ({ signal }) =>
      getAdminData<RiskSummary>("/api/risk/summary", signal),
    initialData: initialSummary || undefined,
    staleTime: 30000,
  });
  const pulse = useQuery({
    queryKey: [...scope, "pulse"],
    queryFn: ({ signal }) => getAdminData<Pulse>("/api/risk/pulse", signal),
    staleTime: 60000,
  });
  const patterns = useQuery({
    queryKey: [...scope, "patterns", filter],
    queryFn: ({ signal }) =>
      getAdminData<RiskPattern[]>(`/api/risk/patterns?${filter}`, signal),
    enabled: workspace === "patterns",
    placeholderData: keepPreviousData,
    staleTime: 60000,
  });
  const rows = signals.data?.pages.flatMap((p) => p.rows) || [],
    caseRows = cases.data?.pages.flatMap((p) => p.rows) || [],
    active =
      workspace === "signals"
        ? signals
        : workspace === "cases"
          ? cases
          : patterns;
  const chips = Object.entries(f).filter(([, v]) => v),
    clear = () => {
      setF({ ...EMPTY_RISK_FILTERS });
      setSearch("");
    };
  const shortcut = (key: string) => {
    setWorkspace("signals");
    setF({
      ...EMPTY_RISK_FILTERS,
      ...(key === "high"
        ? { scope: "high_attention" }
        : key === "resolvedToday"
          ? { scope: "resolved_today" }
          : { status: key.toUpperCase() }),
    });
    setSearch("");
  };
  const exportSignals = async () => {
    setExporting(true);
    setExportMessage("");
    try {
      await mutateNetwork("/api/exports", {
        moduleKey: "fraud",
        filters: filter,
      });
      setExportMessage(
        "Filtered report queued. Open Reports to download it securely.",
      );
    } catch (e) {
      setExportMessage(e instanceof Error ? e.message : "Export unavailable.");
    } finally {
      setExporting(false);
    }
  };
  return (
    <div className="risk-workspace">
      <header className="risk-heading">
        <div>
          <span className="risk-kicker">Trust & safety / Risk operations</span>
          <h1>Risk Intelligence</h1>
          <p>
            Investigate security signals across QR identities, activations and
            vehicle activity.
          </p>
        </div>
        <div className="risk-actions">
          <button
            className="risk-button"
            onClick={() => void client.invalidateQueries({ queryKey: scope })}
          >
            <VaahanIcon
              name="refresh"
              size={16}
              className={active.isFetching ? "risk-spinning" : ""}
            />
            Refresh
          </button>
          <button
            className="risk-button primary"
            onClick={() => shortcut("unreviewed")}
          >
            Investigation queue <VaahanIcon name="arrow-right" size={15} />
          </button>
        </div>
      </header>
      <div className="risk-summary" aria-label="Operations summary">
        {[
          ["unreviewed", "Unreviewed"],
          ["high", "High attention"],
          ["investigating", "Investigating"],
          ["monitoring", "Monitoring"],
          ["resolvedToday", "Resolved today"],
        ].map(([k, l]) => (
          <button key={k} onClick={() => shortcut(k!)}>
            <span>{l}</span>
            <strong>
              {summary.data ? summary.data[k as keyof RiskSummary] : "—"}
            </strong>
            <VaahanIcon name="arrow-right" size={14} />
          </button>
        ))}
      </div>
      {summary.isError && (
        <RiskError
          message="Operations summary unavailable."
          retry={summary.refetch}
        />
      )}
      {pulse.isPending ? (
        <div
          className="risk-panel risk-pulse-loading"
          role="status"
          aria-label="Loading risk pulse"
        />
      ) : pulse.isError ? (
        <RiskError
          message="Risk activity visualization unavailable."
          retry={pulse.refetch}
        />
      ) : (
        <RiskPulse pulse={pulse.data} inspect={setInspect} />
      )}
      <div className="risk-workspace-top">
        <Tabs value={workspace} onValueChange={setWorkspace}>
          <TabsList aria-label="Risk workspace">
            <TabsTrigger value="signals">Signals</TabsTrigger>
            <TabsTrigger value="cases">Cases</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
          </TabsList>
        </Tabs>
        <span className="risk-muted" role="status">
          {active.isFetching
            ? "Updating risk signals…"
            : "Evidence informs review; signals are not verdicts."}
        </span>
      </div>
      <div className="risk-toolbar">
        <div className="risk-search">
          <VaahanIcon name="search" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search signal, QR, vehicle or case"
            placeholder="Search signal, QR, vehicle or case…"
          />
        </div>
        <div className="risk-desktop-filters">
          <RiskFilterFields f={f} change={setF} />
        </div>
        <button className="risk-button" onClick={() => setFiltersOpen(true)}>
          <VaahanIcon name="filter" size={15} />
          <span className="risk-filter-label">More filters</span>
          {chips.length > 0 && <span>{chips.length}</span>}
        </button>
        {workspace !== "patterns" && (
          <div className="risk-view" role="group" aria-label="Result view">
            {["grid", "rows"].map((v) => (
              <button
                key={v}
                className="risk-button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
              >
                {riskLabel(v)}
              </button>
            ))}
          </div>
        )}
        {workspace === "signals" &&
          ["SUPER_ADMIN", "OPS_ADMIN", "READ_ONLY_ANALYST"].includes(
            identity.role,
          ) && (
            <button
              className="risk-button"
              disabled={exporting || !rows.length}
              onClick={() => void exportSignals()}
            >
              <VaahanIcon name="download" size={15} />
              {exporting ? "Exporting…" : "Export"}
            </button>
          )}
      </div>
      {chips.length > 0 && (
        <div className="risk-chips">
          {chips.map(([k, v]) => (
            <button
              className="risk-chip"
              key={k}
              aria-label={`Remove ${k} filter ${v}`}
              onClick={() => {
                setF((prev) => ({ ...prev, [k]: "" }));
                if (k === "q") setSearch("");
              }}
            >
              {riskLabel(k)}: {riskLabel(v)}
              <VaahanIcon name="close" size={12} />
            </button>
          ))}
          <button className="risk-link" onClick={clear}>
            Clear all
          </button>
        </div>
      )}
      {exportMessage && (
        <p role="status" className="risk-muted">
          {exportMessage}{" "}
          <Link className="risk-link" href="/reports">
            Open Reports →
          </Link>
        </p>
      )}
      {active.isError && (
        <RiskError
          message={`Unable to load risk ${workspace}.`}
          retry={active.refetch}
        />
      )}
      {active.isPending ? (
        <RiskSkeleton />
      ) : workspace === "patterns" ? (
        <PatternMatrix
          rows={patterns.data || []}
          select={(p) => {
            setF((v) => ({
              ...v,
              category: p.category,
              severity: p.severity,
              lifecycle: p.lifecycle || "",
            }));
            setWorkspace("signals");
          }}
        />
      ) : workspace === "cases" ? (
        caseRows.length ? (
          <CaseList rows={caseRows} view={view} />
        ) : (
          <Empty workspace="cases" filtered={chips.length > 0} clear={clear} />
        )
      ) : rows.length ? (
        <SignalList rows={rows} view={view} inspect={setInspect} />
      ) : (
        !active.isError && (
          <Empty
            workspace="signals"
            filtered={chips.length > 0}
            clear={clear}
          />
        )
      )}
      {workspace === "signals" && signals.hasNextPage && (
        <button
          className="risk-button risk-load"
          disabled={signals.isFetchingNextPage || signals.isPlaceholderData}
          onClick={() => void signals.fetchNextPage()}
        >
          {signals.isFetchingNextPage ? "Loading…" : "Load more signals"}
        </button>
      )}
      {workspace === "cases" && cases.hasNextPage && (
        <button
          className="risk-button risk-load"
          disabled={cases.isFetchingNextPage || cases.isPlaceholderData}
          onClick={() => void cases.fetchNextPage()}
        >
          Load more cases
        </button>
      )}
      {filtersOpen && (
        <RiskFilterSheet
          open
          onClose={() => setFiltersOpen(false)}
          f={f}
          change={setF}
        />
      )}
      <Sheet
        open={!!inspect}
        onOpenChange={(v) => {
          if (!v) setInspect(null);
        }}
      >
        <SheetContent className="risk-sheet risk-inspect">
          <SheetTitle>Signal evidence</SheetTitle>
          <SheetDescription>
            Inspect the source evidence before taking action.
          </SheetDescription>
          {inspect && <RiskInspect identity={identity} id={inspect} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}
function SignalList({
  rows,
  view,
  inspect,
}: {
  rows: RiskSignal[];
  view: string;
  inspect: (id: string) => void;
}) {
  return (
    <>
      <div
        className={`risk-grid ${view === "rows" ? "risk-mobile-cards" : ""}`}
      >
        {rows.map((s) => (
          <article className="risk-card" key={s.id}>
            <div className="risk-card-top">
              <button className="risk-reference" onClick={() => inspect(s.id)}>
                {s.reference_code}
              </button>
              <RiskBadge severity value={s.severity} />
            </div>
            <span className="risk-kicker">{riskLabel(s.category)}</span>
            <h2>{s.title}</h2>
            <SignalIdentity signal={s} />
            <Fingerprint signal={s} />
            <div className="risk-card-meta">
              <time dateTime={s.observed_at}>{riskDate(s.observed_at)}</time>
              <span>{s.case_reference || "No case assigned"}</span>
            </div>
            <div className="risk-card-footer">
              <RiskBadge value={s.review_status} />
              <button className="risk-button" onClick={() => inspect(s.id)}>
                Investigate <VaahanIcon name="arrow-right" size={14} />
              </button>
            </div>
          </article>
        ))}
      </div>
      {view === "rows" && (
        <div className="risk-table-wrap">
          <table className="risk-table">
            <thead>
              <tr>
                {[
                  "Signal",
                  "Entity",
                  "Signal fingerprint",
                  "Severity",
                  "Status",
                  "Observed",
                  "Investigation",
                  "Actions",
                ].map((t) => (
                  <th key={t}>{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td>
                    <button
                      className="risk-reference"
                      onClick={() => inspect(s.id)}
                    >
                      {s.reference_code}
                    </button>
                    <span>{s.title}</span>
                  </td>
                  <td>
                    <SignalIdentity signal={s} />
                  </td>
                  <td>
                    <strong>{s.event_count} source events</strong>
                    <span>{s.evidence_summary}</span>
                  </td>
                  <td>
                    <RiskBadge severity value={s.severity} />
                  </td>
                  <td>
                    <RiskBadge value={s.review_status} />
                  </td>
                  <td>
                    <time dateTime={s.observed_at}>
                      {riskDate(s.observed_at)}
                    </time>
                  </td>
                  <td>
                    {s.case_reference ? (
                      <Link
                        className="risk-link"
                        href={`/fraud/cases/${s.case_id}`}
                      >
                        {s.case_reference}
                      </Link>
                    ) : (
                      "No case"
                    )}
                  </td>
                  <td>
                    <button
                      className="risk-button"
                      onClick={() => inspect(s.id)}
                      aria-label={`Investigate ${s.reference_code}`}
                    >
                      <VaahanIcon name="eye" size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
function CaseList({ rows, view }: { rows: RiskCase[]; view: string }) {
  return (
    <div className={view === "grid" ? "risk-grid" : "risk-case-rows"}>
      {rows.map((c) => (
        <article className="risk-card" key={c.id}>
          <div className="risk-card-top">
            <Link className="risk-reference" href={`/fraud/cases/${c.id}`}>
              {c.reference_code}
            </Link>
            <RiskBadge severity value={c.priority} />
          </div>
          <h2>{c.title}</h2>
          <p className="risk-muted">
            {c.signal_count} related signals · {c.assigned_name || "Unassigned"}
          </p>
          <time dateTime={c.opened_at}>{riskDate(c.opened_at)}</time>
          <div className="risk-card-footer">
            <RiskBadge value={c.status} />
            <Link className="risk-button" href={`/fraud/cases/${c.id}`}>
              Open investigation
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
function PatternMatrix({
  rows,
  select,
}: {
  rows: RiskPattern[];
  select: (p: RiskPattern) => void;
}) {
  return (
    <section className="risk-panel">
      <span className="risk-kicker">Observed patterns</span>
      <h2>Signal matrix</h2>
      <p className="risk-muted">
        Aggregate evidence within the selected filters. Select a pattern to
        inspect its signals.
      </p>
      {rows.length ? (
        <div className="risk-pattern-grid">
          {rows.map((p, i) => (
            <button key={i} className="risk-pattern" onClick={() => select(p)}>
              <span>
                {riskLabel(p.category)} · {riskLabel(p.lifecycle)}
              </span>
              <strong>{p.total}</strong>
              <RiskBadge severity value={p.severity} />
              <small>
                {p.unreviewed} unreviewed · {p.dismissed} dismissed
              </small>
            </button>
          ))}
        </div>
      ) : (
        <p>No observed patterns match these filters.</p>
      )}
    </section>
  );
}
function Empty({
  workspace,
  filtered,
  clear,
}: {
  workspace: string;
  filtered: boolean;
  clear: () => void;
}) {
  return (
    <div className="risk-empty">
      <VaahanIcon name="shield-check" size={34} />
      <span className="risk-kicker">
        {filtered
          ? "No matching " + workspace
          : workspace === "cases"
            ? "No investigations opened"
            : "No risk signals require review"}
      </span>
      <h2>
        {filtered
          ? "Adjust the investigation filters"
          : workspace === "cases"
            ? "A case starts with evidence"
            : "A calm queue. A clear view."}
      </h2>
      <p>
        {filtered
          ? "No records match the current severity, source, status or date range."
          : workspace === "cases"
            ? "Open an investigation from a real signal to correlate evidence and record a decision."
            : "Eligible activation and QR lifecycle events are evaluated on the server. No operator action is required right now."}
      </p>
      {filtered ? (
        <button className="risk-button" onClick={clear}>
          Clear filters
        </button>
      ) : (
        <div className="risk-empty-flow">
          <span>Activation</span>
          <span>QR activity</span>
          <span>Replacement context</span>
          <VaahanIcon name="arrow-right" size={18} />
          <span>Evidence</span>
          <VaahanIcon name="arrow-right" size={18} />
          <span>Review</span>
        </div>
      )}
    </div>
  );
}
