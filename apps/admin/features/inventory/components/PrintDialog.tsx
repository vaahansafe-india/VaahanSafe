"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AdminDialog } from "../../../components/AdminDialog";
import { AdminSelect } from "../../../components/AdminSelect";
import { VEHICLE_STICKER_V1 } from "../print/sticker-template";
import { EmailVerification } from "../../../components/EmailVerification";
import { getAdminData } from "../../../lib/client-api";
import type {
  InventorySelection,
  PrintJob,
  StickerTemplate,
} from "../inventory.types";
import { stateLabel } from "./InventoryFilters";
export async function postInventory<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok || !result.success)
    throw Object.assign(
      new Error(
        result.error?.message ||
          "We couldn't complete this operation. Please try again.",
      ),
      { code: result.error?.code },
    );
  return result.data as T;
}
type Eligible = {
  id: string;
  visibleCode: string;
  eligibility: { print: boolean; reprint: boolean; reason: string | null };
};
export function PrintDialog({
  selection,
  onClose,
}: {
  selection: InventorySelection;
  onClose: () => void;
}) {
  const [mode, setMode] = useState("PRINT"),
    [reason, setReason] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [stepUp, setStepUp] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [job, setJob] = useState<PrintJob | null>(null),
    [requestId] = useState(() => crypto.randomUUID());
  const query = useQuery({
    queryKey: ["print-eligibility", selection],
    queryFn: () =>
      postInventory<Eligible[]>("/api/inventory/print-eligibility", {
        selection,
      }),
    retry: false,
  });
  async function create() {
    setBusy(true);
    setError("");
    try {
      setJob(
        await postInventory<PrintJob>("/api/inventory/print-jobs", {
          selection,
          mode,
          reason,
          requestId,
        }),
      );
    } catch (e) {
      if ((e as { code?: string }).code === "STEP_UP_REQUIRED") setStepUp(true);
      else setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const allowed =
    query.data?.length &&
    query.data.every((r) =>
      mode === "PRINT" ? r.eligibility.print : r.eligibility.reprint,
    );
  const footer = job ? (
    <Link
      className="admin-button primary"
      href={`/inventory/print-jobs/${job.id}`}
    >
      Open secure print job ↗
    </Link>
  ) : (
    <div className="admin-dialog-action-row">
      <button className="admin-button" onClick={onClose}>
        Cancel
      </button>
      {!stepUp && (
        <button
          className="admin-button primary"
          disabled={busy || !allowed || !confirmed || reason.trim().length < 10}
          onClick={() => void create()}
        >
          {busy ? "Creating…" : "Create print job"}
        </button>
      )}
    </div>
  );
  return (
    <AdminDialog
      title={
        stepUp
          ? "Verify production access"
          : job
            ? "Print job created"
            : "Review production printing"
      }
      description={
        stepUp
          ? "Confirm your identity before creating protected output."
          : job
            ? "Your production request has been recorded."
            : "Review the identities and provide a reason for this manufacturing run."
      }
      className="inventory-production-dialog"
      footer={footer}
      onClose={onClose}
    >
      {stepUp ? (
        <EmailVerification
          stepUp
          onVerified={() => {
            setStepUp(false);
            setError("Email verified. Review and confirm the print job again.");
          }}
        />
      ) : job ? (
        <>
          <p>
            {job.reference} · {job.quantity} stickers
          </p>
          <p>
            The job records your reason. Preparing or downloading its file does
            not mark the stickers as physically printed.
          </p>
        </>
      ) : (
        <>
          <dl className="production-format-summary">
            <div>
              <dt>Finished sticker</dt>
              <dd>
                {VEHICLE_STICKER_V1.widthMm} × {VEHICLE_STICKER_V1.heightMm} mm
              </dd>
            </div>
            <div>
              <dt>Artwork with bleed</dt>
              <dd>
                {VEHICLE_STICKER_V1.widthMm + 2 * VEHICLE_STICKER_V1.bleedMm} ×{" "}
                {VEHICLE_STICKER_V1.heightMm + 2 * VEHICLE_STICKER_V1.bleedMm}{" "}
                mm
              </dd>
            </div>
            <div>
              <dt>Print layout</dt>
              <dd>One sticker per page</dd>
            </div>
          </dl>
          <label className="inventory-form-label">
            Operation
            <AdminSelect
              label="Print operation"
              value={mode}
              onValueChange={setMode}
              options={[
                { value: "PRINT", label: "First print" },
                { value: "REPRINT", label: "Reprint · Super admin only" },
              ]}
            />
          </label>
          {query.isPending ? (
            <p role="status">Checking lifecycle and credential availability…</p>
          ) : query.isError ? (
            <p className="admin-notice error" role="alert">
              {query.error.message}
            </p>
          ) : (
            <section className="production-selection">
              <div className="production-section-heading">
                <h3>Selected identities</h3>
                <span>{query.data.length} selected · Maximum 100</span>
              </div>
              <div className="inventory-print-review">
                {query.data.map((r) => (
                  <div key={r.id}>
                    <strong>{r.visibleCode}</strong>
                    <span>
                      {(
                        mode === "PRINT"
                          ? r.eligibility.print
                          : r.eligibility.reprint
                      )
                        ? "Eligible"
                        : r.eligibility.reason ||
                          `Not eligible for ${mode.toLowerCase()}`}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
          <label className="inventory-form-label">
            Production reason
            <textarea
              aria-label="Production reason"
              aria-describedby="production-reason-help"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              minLength={10}
              maxLength={500}
              placeholder="Describe the manufacturing run or why a reprint is required…"
            />
            <span id="production-reason-help" className="production-field-help">
              Describe the print run or replacement need. Minimum 10 characters.
            </span>
          </label>
          <label className="inventory-check production-confirmation">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span className="production-confirmation-copy">
              <strong>I reviewed all selected identities.</strong>
              <span>
                I’ll protect the private activation codes during printing.
              </span>
            </span>
          </label>
          <div className="production-handling-note">
            <strong>Protected manufacturing output</strong>
            <p>
              File access expires after 10 minutes. Apply opaque scratch foil
              over the printed private code before distribution. Printing alone
              does not activate any services.
            </p>
          </div>
          {error && (
            <p role="alert" className="admin-notice error">
              {error}
            </p>
          )}
        </>
      )}
    </AdminDialog>
  );
}
type JobMetadata = PrintJob & {
  template: StickerTemplate;
  items: { sequence: number; qr: { visible_code: string } }[];
};
export function PrintJobPage({ id }: { id: string }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [stepUp, setStepUp] = useState(false),
    [reason, setReason] = useState(""),
    [confirmed, setConfirmed] = useState(false);
  const query = useQuery({
    queryKey: ["print-job", id],
    queryFn: ({ signal }) =>
      getAdminData<JobMetadata>(`/api/inventory/print-jobs/${id}`, signal),
    retry: false,
  });
  function handleError(e: unknown) {
    if ((e as { code?: string }).code === "STEP_UP_REQUIRED") setStepUp(true);
    else setError(e instanceof Error ? e.message : "Please try again.");
  }
  async function action(action: string) {
    setBusy(true);
    setError("");
    try {
      await postInventory(`/api/inventory/print-jobs/${id}`, {
        action,
        reason,
        confirmed,
      });
      setConfirmed(false);
      await query.refetch();
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(false);
    }
  }
  async function download() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/inventory/print-jobs/${id}/artifact`, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!r.ok) {
        const e = await r.json();
        throw Object.assign(
          new Error(e.error?.message || "The print artifact is unavailable."),
          { code: e.error?.code },
        );
      }
      const url = URL.createObjectURL(await r.blob()),
        link = document.createElement("a");
      link.href = url;
      link.download = `${query.data?.reference || "production-sticker"}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      await query.refetch();
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(false);
    }
  }
  const job = query.data;
  return (
    <div className="inventory-workspace inventory-job-page">
      <Link href="/inventory">← QR inventory</Link>
      <header className="inventory-header">
        <div>
          <p className="admin-section-label">SECURE PRODUCTION OUTPUT</p>
          <h1>{job?.reference || "Print job"}</h1>
        </div>
        <button className="admin-button" onClick={() => void query.refetch()}>
          Refresh
        </button>
      </header>
      {query.isPending ? (
        <p role="status">Loading print job…</p>
      ) : query.isError ? (
        <div className="admin-notice error" role="alert">
          <p>{query.error.message}</p>
          {(query.error as { code?: string }).code === "STEP_UP_REQUIRED" && (
            <button className="admin-button" onClick={() => setStepUp(true)}>
              Verify email
            </button>
          )}
        </div>
      ) : (
        job && (
          <>
            <section className="inventory-panel">
              <span className="inventory-state">{stateLabel(job.status)}</span>
              <p>
                {job.mode} · {job.quantity} individual sticker pages ·{" "}
                {job.template.version}
              </p>
              <p>Reason: {job.reason}</p>
              <p>
                File access expires:{" "}
                {new Date(job.expiresAt).toLocaleString("en-IN")}.
              </p>
              <p>
                <strong>Print at actual size / 100%.</strong> Page{" "}
                {job.template.widthMm + 2 * job.template.bleedMm} ×{" "}
                {job.template.heightMm + 2 * job.template.bleedMm} mm, trimmed
                to {job.template.widthMm} × {job.template.heightMm} mm. Disable
                “Fit to page.” Apply scratch coating over the private activation
                code.
              </p>
              <p>
                The file contains private manufacturing credentials. Keep it
                within your approved print process.
              </p>
              <div className="admin-actions">
                {job.status === "READY" && (
                  <button
                    className="admin-button primary"
                    disabled={busy}
                    onClick={() => void action("GENERATE")}
                  >
                    Prepare vector PDF
                  </button>
                )}
                {["READY_TO_PRINT", "PRINTING"].includes(job.status) && (
                  <button
                    className="admin-button primary"
                    disabled={busy}
                    onClick={() => void download()}
                  >
                    Download protected print PDF
                  </button>
                )}
              </div>
              <details>
                <summary>Review {job.quantity} identities</summary>
                <ol>
                  {job.items.map((i) => (
                    <li key={i.sequence}>{i.qr.visible_code}</li>
                  ))}
                </ol>
              </details>
            </section>
            {!["COMPLETED", "CANCELLED"].includes(job.status) && (
              <section className="inventory-panel">
                <h2>Confirm physical outcome</h2>
                <p>
                  Confirm completion only after inspecting the physical
                  stickers, QR scans and opaque scratch coverage. A file
                  download cannot verify physical printing.
                </p>
                <label className="inventory-form-label">
                  Outcome reason
                  <textarea
                    minLength={10}
                    maxLength={500}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
                <label className="inventory-check">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  <span>
                    I verified the physical outcome and reviewed all affected
                    identities.
                  </span>
                </label>
                <div className="admin-actions">
                  <button
                    className="admin-button"
                    disabled={busy || !confirmed || reason.trim().length < 10}
                    onClick={() => void action("CANCEL")}
                  >
                    Cancel / resolve job
                  </button>
                  {job.status === "PRINTING" && (
                    <button
                      className="admin-button primary"
                      disabled={busy || !confirmed || reason.trim().length < 10}
                      onClick={() => void action("COMPLETE")}
                    >
                      Record verified printing
                    </button>
                  )}
                </div>
              </section>
            )}
          </>
        )
      )}
      {busy && <p role="status">Completing the secure operation…</p>}
      {error && (
        <p className="admin-notice error" role="alert">
          {error}
        </p>
      )}
      {stepUp && (
        <AdminDialog
          title="Fresh verification"
          onClose={() => setStepUp(false)}
        >
          <EmailVerification
            stepUp
            onVerified={() => {
              setStepUp(false);
              void query.refetch();
            }}
          />
        </AdminDialog>
      )}
    </div>
  );
}
