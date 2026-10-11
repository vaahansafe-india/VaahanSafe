"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EmailVerification } from "../../../components/EmailVerification";
import { getAdminData } from "../../../lib/client-api";
import { mutateNetwork } from "../../network/mutation";
import type { StockReleaseStatus } from "../stock-release.schema";
export function VerifiedPrintStockRelease({ id }: { id: string }) {
  const [reason, setReason] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [stepUp, setStepUp] = useState(false);
  const request = useRef<{ fingerprint: string; id: string } | null>(null),
    client = useQueryClient();
  const query = useQuery({
    queryKey: ["print-stock-release", id],
    queryFn: ({ signal }) =>
      getAdminData<StockReleaseStatus>(
        `/api/inventory/print-jobs/${id}/release`,
        signal,
      ),
    staleTime: 0,
  });
  async function save() {
    if (
      !confirmed ||
      reason.trim().length < 10 ||
      !query.data?.canRelease ||
      busy
    )
      return;
    setBusy(true);
    setError("");
    const fingerprint = JSON.stringify({ id, reason: reason.trim() });
    if (request.current?.fingerprint !== fingerprint)
      request.current = { fingerprint, id: crypto.randomUUID() };
    try {
      await mutateNetwork(`/api/inventory/print-jobs/${id}/release`, {
        reason: reason.trim(),
        confirmed,
        requestId: request.current.id,
      });
      await query.refetch();
      await client.invalidateQueries({
        predicate: (q) =>
          [
            "inventory",
            "inventory-detail",
            "transfers",
            "distributors",
            "retailers",
            "batches",
          ].some((k) => q.queryKey.includes(k)),
      });
      setConfirmed(false);
    } catch (e) {
      if ((e as { code?: string }).code === "STEP_UP_REQUIRED") setStepUp(true);
      else {
        setError(
          e instanceof Error
            ? e.message
            : "We couldn’t release these stickers. Please try again.",
        );
        void query.refetch();
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="inventory-panel" aria-busy={busy}>
      <h2>Release verified printed stock</h2>
      {query.isPending ? (
        <p role="status">Checking this print job’s verified stickers…</p>
      ) : query.isError ? (
        <div role="alert">
          <p>We couldn’t check stock readiness. Please try again.</p>
          <button className="admin-button" onClick={() => void query.refetch()}>
            Retry
          </button>
        </div>
      ) : query.data?.release ? (
        <>
          <p role="status">
            <strong>
              {query.data.release.quantity} verified sticker
              {query.data.release.quantity === 1 ? "" : "s"} released
            </strong>{" "}
            · {new Date(query.data.release.createdAt).toLocaleString("en-IN")}
          </p>
          <p>
            Next, request Central inventory → Distributor. Record approval,
            physical dispatch and acknowledged receipt, then transfer to the
            retailer. Record the retail sale before customer activation.
          </p>
          <Link className="admin-button primary" href="/transfers/new">
            Create central stock transfer
          </Link>
        </>
      ) : (
        <>
          <p>
            Release only the {query.data?.quantity} inspected sticker
            {query.data?.quantity === 1 ? "" : "s"} in this completed job for
            distribution. The rest of the batch keeps its current status. Owner
            services require separate retail sale and customer activation.
          </p>
          {stepUp ? (
            <EmailVerification
              stepUp
              onVerified={() => {
                setStepUp(false);
                setError("");
              }}
            />
          ) : query.data?.canRelease ? (
            <>
              <label className="inventory-form-label">
                Release reason *
                <textarea
                  value={reason}
                  minLength={10}
                  maxLength={500}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={busy}
                />
              </label>
              <label className="inventory-check">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  disabled={busy}
                />
                <span>
                  I inspected these printed stickers and approve them for
                  distribution.
                </span>
              </label>
              <button
                className="admin-button primary"
                disabled={busy || !confirmed || reason.trim().length < 10}
                onClick={() => void save()}
              >
                {busy ? "Releasing…" : "Release verified stickers"}
              </button>
            </>
          ) : (
            <p role="status">
              This job currently has {query.data?.eligible} eligible units.
              Every sticker must have verified printing, available central
              custody and unused activation proof. An operations administrator
              must approve release.
            </p>
          )}
        </>
      )}
      {error && (
        <p className="admin-notice error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
