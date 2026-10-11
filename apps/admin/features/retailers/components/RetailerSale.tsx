"use client";
import { useDeferredValue, useId, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { toast } from "@vaahansafe/ui/components/sonner";
import { AdminDialog } from "../../../components/AdminDialog";
import { EmailVerification } from "../../../components/EmailVerification";
import { getAdminData } from "../../../lib/client-api";
import type { RetailerRow } from "../retailer.types";
import type { SaleOption, RetailSale } from "../retail-sale.schema";
import { timeLabel } from "./RetailerWorkspace";
import "../retail-sale.css";

export function RetailerSaleDialog({
  retailer,
  onClose,
  onChanged,
}: {
  retailer: RetailerRow;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [search, setSearch] = useState(""),
    deferred = useDeferredValue(search),
    [selected, setSelected] = useState<SaleOption[]>([]),
    [receipt, setReceipt] = useState(""),
    [reason, setReason] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [stepUp, setStepUp] = useState(false),
    request = useRef<{ fingerprint: string; id: string } | null>(null),
    id = useId();
  const query = useInfiniteQuery({
    queryKey: ["retailers", "sale-options", retailer.id, deferred],
    queryFn: ({ signal, pageParam }) =>
      getAdminData<{ rows: SaleOption[]; nextCursor: string | null }>(
        `/api/retailers/${retailer.id}/sales?q=${encodeURIComponent(deferred)}${pageParam ? "&after=" + encodeURIComponent(pageParam) : ""}`,
        signal,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (p) => p.nextCursor,
    staleTime: 0,
  });
  const options = [
    ...new Map(
      query.data?.pages.flatMap((p) => p.rows).map((r) => [r.id, r]) || [],
    ).values(),
  ];
  const save = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    const base = {
        codes: selected.map((s) => s.visible_code).sort(),
        receipt: receipt.trim().toUpperCase(),
        reason: reason.trim(),
      },
      fingerprint = JSON.stringify(base);
    if (request.current?.fingerprint !== fingerprint)
      request.current = { fingerprint, id: crypto.randomUUID() };
    try {
      const response = await fetch(`/api/retailers/${retailer.id}/sales`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...base, requestId: request.current.id }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        if (result.error?.code === "STEP_UP_REQUIRED") {
          setStepUp(true);
          return;
        }
        throw Error(
          result.error?.message ||
            "We couldn't record this sale. Please try again.",
        );
      }
      onChanged();
      toast.success(
        "Retail sale recorded. The customer can now verify and activate these stickers.",
      );
      onClose();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "We couldn't record this sale. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <AdminDialog
      title="Record retail sale"
      description={`${retailer.name} · ${retailer.reference_code}. Record a completed physical sale using its receipt or sales-register reference.`}
      onClose={() => {
        if (!busy) onClose();
      }}
      className="retail-sale-dialog"
      footer={
        !stepUp && (
          <>
            <button
              type="button"
              className="dist-btn"
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="dist-btn dist-primary"
              disabled={
                busy ||
                !confirmed ||
                !selected.length ||
                receipt.trim().length < 3 ||
                reason.trim().length < 10 ||
                query.isError ||
                query.isFetching
              }
              onClick={() => void save()}
            >
              {busy
                ? "Recording…"
                : `Record sale · ${selected.length} ${selected.length === 1 ? "sticker" : "stickers"}`}
            </button>
          </>
        )
      }
    >
      {stepUp ? (
        <EmailVerification stepUp onVerified={() => setStepUp(false)} />
      ) : (
        <div className="retail-sale-form" aria-busy={busy}>
          <p className="retail-sale-note">
            A sale makes the sticker eligible for activation. The customer must
            still verify the private code, sign in with a verified mobile
            number, and connect their vehicle.
          </p>
          <label htmlFor={`${id}-search`}>
            Find a sticker in this retailer’s stock
          </label>
          <input
            id={`${id}-search`}
            value={search}
            maxLength={100}
            disabled={busy}
            placeholder="Search visible VaahanSafe ID"
            onChange={(e) => setSearch(e.target.value)}
          />
          <div
            className="retail-sale-stock"
            aria-label="Eligible retailer stickers"
          >
            {query.isPending ? (
              <p role="status">Checking eligible stock…</p>
            ) : query.isError ? (
              <div className="dist-error" role="alert">
                  We couldn’t load eligible stock.{" "}
                <button type="button" onClick={() => void query.refetch()}>
                  Retry
                </button>
              </div>
            ) : !options.length ? (
              <div className="retail-sale-empty">
                <strong>
                  {search
                    ? "No matching eligible stickers"
                    : "No stickers ready for sale"}
                </strong>
                <p>
                  Only verified, printed retail stock received by this outlet
                  appears here. Reserved, damaged, already sold or activated
                  stickers cannot be selected.
                </p>
                <a href="/transfers">Review stock transfers</a>
                <span> · </span>
                <a href="/inventory">Review printing</a>
              </div>
            ) : (
              options.map((row) => (
                <label key={row.id} className="retail-sale-option">
                  <input
                    type="checkbox"
                    checked={selected.some((s) => s.id === row.id)}
                    disabled={
                      busy ||
                      (selected.length >= 100 &&
                        !selected.some((s) => s.id === row.id))
                    }
                    onChange={(e) =>
                      setSelected((rows) =>
                        e.target.checked
                          ? [...rows, row]
                          : rows.filter((s) => s.id !== row.id),
                      )
                    }
                  />
                  <span>
                    <strong>{row.visible_code}</strong>
                    <small>
                      Batch {row.batch_reference} · Received by retailer
                    </small>
                  </span>
                </label>
              ))
            )}
            {query.hasNextPage && (
              <button
                type="button"
                className="dist-btn"
                disabled={busy || query.isFetching}
                onClick={() => void query.fetchNextPage()}
              >
                {query.isFetchingNextPage ? "Loading…" : "Load more stickers"}
              </button>
            )}
          </div>
          <p role="status">{selected.length} / 100 selected</p>
          {selected.length > 0 && (
            <div
              className="retail-sale-selected"
              aria-label="Selected stickers"
            >
              {selected.map((s) => (
                <button
                  type="button"
                  className="dist-btn"
                  disabled={busy}
                  key={s.id}
                  onClick={() =>
                    setSelected((rows) => rows.filter((r) => r.id !== s.id))
                  }
                  aria-label={`Remove ${s.visible_code}`}
                >
                  {s.visible_code} ×
                </button>
              ))}
            </div>
          )}
          <label htmlFor={`${id}-receipt`}>
            Receipt / sales-register reference
          </label>
          <input
            id={`${id}-receipt`}
            value={receipt}
            maxLength={80}
            minLength={3}
            required
            disabled={busy}
            onChange={(e) => setReceipt(e.target.value)}
          />
          <small>
            Use the existing reference for this sale. Each reference can be
            recorded once per retailer.
          </small>
          <label htmlFor={`${id}-reason`}>Operational reason</label>
          <textarea
            id={`${id}-reason`}
            rows={3}
            value={reason}
            maxLength={500}
            minLength={10}
            required
            disabled={busy}
            onChange={(e) => setReason(e.target.value)}
          />
          <small>
            10–500 characters. Keep customer contact details and private
            activation codes out of this note.
          </small>
          <label className="retail-sale-confirm">
            <input
              type="checkbox"
              checked={confirmed}
              disabled={busy}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span>
              I checked the physical stickers and sale record. These selected
              stickers were sold by this retailer.
            </span>
          </label>
          {error && (
            <div className="dist-error" role="alert">
              {error}
              <button
                type="button"
                disabled={busy}
                onClick={() => void query.refetch()}
              >
                Refresh eligible stock
              </button>
            </div>
          )}
        </div>
      )}
    </AdminDialog>
  );
}

export function RetailerSales({ id }: { id: string }) {
  const query = useInfiniteQuery({
    queryKey: ["retailers", "sales", id],
    queryFn: ({ signal, pageParam }) =>
      getAdminData<{ rows: RetailSale[]; nextCursor: string | null }>(
        `/api/retailers/${id}/sales?section=history${pageParam ? "&cursor=" + encodeURIComponent(pageParam) : ""}`,
        signal,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (p) => p.nextCursor,
    staleTime: 20000,
  });
  const rows = [
    ...new Map(
      query.data?.pages.flatMap((p) => p.rows).map((r) => [r.id, r]) || [],
    ).values(),
  ];
  return (
    <section className="dist-detail-panel">
      <h2>Recorded retail sales</h2>
      <p>
        Sale records preserve retailer custody and the receipt reference.
        Customer activation is recorded separately.
      </p>
      {query.isPending ? (
        <p role="status">Loading sales…</p>
      ) : query.isError ? (
        <div role="alert" className="dist-error">
            We couldn’t load retail sales.{" "}
          <button type="button" onClick={() => void query.refetch()}>
            Retry
          </button>
        </div>
      ) : !rows.length ? (
        <div className="dist-empty-state">
          <h3>No retail sales recorded</h3>
          <p>
            Record a completed sale after the retailer receives eligible printed
            stickers.
          </p>
        </div>
      ) : (
        rows.map((row) => (
          <article
            className="dist-history-row retail-sale-history"
            key={row.id}
          >
            <div>
              <strong>{row.reference_code}</strong>
              <p>
                {row.quantity} {row.quantity === 1 ? "sticker" : "stickers"} ·
                Receipt {row.receipt_reference}
              </p>
              <small>
                {timeLabel(row.created_at)} · {row.actor_name}
              </small>
              <p>{row.reason}</p>
              <details>
                <summary>View sold VaahanSafe IDs</summary>
                <ul>
                  {row.visible_codes.map((code) => (
                    <li key={code}>{code}</li>
                  ))}
                </ul>
              </details>
            </div>
          </article>
        ))
      )}
      {query.hasNextPage && (
        <button
          type="button"
          className="dist-btn"
          disabled={query.isFetching}
          onClick={() => void query.fetchNextPage()}
        >
          {query.isFetchingNextPage ? "Loading…" : "Load more sales"}
        </button>
      )}
    </section>
  );
}
