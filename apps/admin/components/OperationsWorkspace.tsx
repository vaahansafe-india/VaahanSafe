"use client";
import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { VaahanIcon } from "@vaahansafe/icons";
import type { AdminIdentity, AdminList, AdminRow } from "../lib/contracts";
import { canMutateModule, getAdminModule } from "../lib/modules";
import { columnLabel, displayValue } from "../lib/presentation";
import { RecordTable } from "./RecordTable";
import { AdminDialog } from "./AdminDialog";
import { EmailVerification } from "./EmailVerification";
import { AdminSelect } from "./AdminSelect";
import { getAdminData } from "../lib/client-api";
import { MonitoringPanel } from "./MonitoringPanel";
import { MediaGallery } from "./MediaGallery";
const editFields: Record<
  string,
  { key: string; label: string; options?: string[]; type?: string }[]
> = {
  partner: [
    { key: "reference_code", label: "Partner reference" },
    { key: "name", label: "Business name" },
    { key: "city", label: "City" },
    { key: "status", label: "Status", options: ["ACTIVE", "SUSPENDED"] },
  ],
  support: [
    {
      key: "customer_user_id",
      label: "Customer account ID (optional, enables customer updates)",
    },
    { key: "reference_code", label: "Ticket reference" },
    { key: "subject", label: "Subject" },
    {
      key: "priority",
      label: "Priority",
      options: ["LOW", "NORMAL", "HIGH", "URGENT"],
    },
    {
      key: "status",
      label: "Status",
      options: [
        "OPEN",
        "IN_PROGRESS",
        "WAITING_CUSTOMER",
        "RESOLVED",
        "CLOSED",
      ],
    },
  ],
  incident: [
    { key: "title", label: "Incident title" },
    { key: "summary", label: "Summary", type: "textarea" },
    {
      key: "impact",
      label: "Impact",
      options: ["NONE", "MINOR", "MAJOR", "CRITICAL"],
    },
    {
      key: "status",
      label: "Status",
      options: ["INVESTIGATING", "IDENTIFIED", "MONITORING", "RESOLVED"],
    },
  ],
  document: [
    { key: "title", label: "Document title" },
    { key: "asset_key", label: "R2 object key" },
    {
      key: "status",
      label: "Publication status",
      options: ["DRAFT", "PUBLISHED", "ARCHIVED"],
    },
  ],
  flag: [
    { key: "name", label: "Feature key" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "enabled", label: "Enabled", options: ["false", "true"] },
  ],
};
async function requestAdmin(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok)
    throw Object.assign(
      new Error(
        result.error?.message ||
          "We couldn't complete this action. Please try again.",
      ),
      { code: result.error?.code },
    );
  return result.data;
}
export function OperationsWorkspace({
  moduleKey,
  identity,
  initial,
  initialError,
}: {
  moduleKey: string;
  identity: AdminIdentity;
  initial: AdminList | null;
  initialError: boolean;
}) {
  const m = getAdminModule(moduleKey)!;
  const [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [actionBusy, setBusy] = useState(false),
    [selected, setSelected] = useState<string[]>([]),
    [inspect, setInspect] = useState<AdminRow | null>(null),
    [editing, setEditing] = useState(false),
    [values, setValues] = useState<Record<string, string>>({}),
    [reason, setReason] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [stepUp, setStepUp] = useState(false),
    [preview, setPreview] = useState<{
      previewId: string;
      count: number;
      rows: AdminRow[];
    } | null>(null),
    [dialogError, setDialogError] = useState("");
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ q: "", status: "", page: 1 });
  const listOptions = (input: typeof filters) => ({
    queryKey: ["admin-records", identity.sessionId, moduleKey, input],
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      getAdminData<AdminList>(
        `/api/operations/${moduleKey}?${new URLSearchParams({ ...input, page: String(input.page) })}`,
        signal,
      ),
  });
  const records = useQuery({
    ...listOptions(filters),
    initialData:
      !filters.q && !filters.status && filters.page === 1 && !initialError
        ? initial || undefined
        : undefined,
  });
  const data = records.isError ? null : records.data;
  const loadError = records.error?.message || "";
  const busy = actionBusy || records.isFetching;
  const writable = canMutateModule(identity.role, moduleKey);
  const inventoryWrite =
    moduleKey === "inventory" &&
    ["SUPER_ADMIN", "OPS_ADMIN"].includes(identity.role);
  const refresh = async (page = 1) => {
    const next = { q, status, page };
    setFilters(next);
    setSelected([]);
    setError("");
    try {
      await queryClient.fetchQuery({ ...listOptions(next), staleTime: 0 });
    } catch {
      /* Query state presents the recoverable error. */
    }
  };
  const closeDialog = useCallback(() => {
    setInspect(null);
    setEditing(false);
    setPreview(null);
    setStepUp(false);
    setDialogError("");
    setReason("");
    setConfirmed(false);
  }, []);
  const startEdit = (row?: AdminRow) => {
    setInspect(row || null);
    setValues(
      Object.fromEntries(
        (editFields[m.action || ""] || []).map((f) => [
          f.key,
          String(row?.[f.key] ?? f.options?.[0] ?? ""),
        ]),
      ),
    );
    setEditing(true);
    setDialogError("");
  };
  const applyEdit = async () => {
    setBusy(true);
    setDialogError("");
    try {
      const payload: Record<string, string | boolean> = { ...values };
      if (m.action === "flag") payload.enabled = values.enabled === "true";
      await requestAdmin(`/api/operations/${moduleKey}`, {
        id: inspect?.id,
        values: payload,
        reason,
        confirmed,
      });
      closeDialog();
      setNotice(
        "Change saved. The audit trail records your reason and request reference.",
      );
      await refresh(data?.page || 1);
    } catch (e) {
      if ((e as { code?: string }).code === "STEP_UP_REQUIRED") setStepUp(true);
      else setDialogError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const previewBlock = async () => {
    setBusy(true);
    setError("");
    try {
      setPreview(
        await requestAdmin("/api/inventory/preview", { ids: selected }),
      );
      setReason("");
      setConfirmed(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const block = async () => {
    setBusy(true);
    setDialogError("");
    try {
      const result = await requestAdmin("/api/inventory/block", {
        previewId: preview?.previewId,
        reason,
        confirmed,
      });
      closeDialog();
      setNotice(
        `${result.affected} QR records blocked. Changes are recorded in the audit trail.`,
      );
      await refresh();
    } catch (e) {
      if ((e as { code?: string }).code === "STEP_UP_REQUIRED") setStepUp(true);
      else setDialogError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const queueExport = async () => {
    setBusy(true);
    setError("");
    try {
      await requestAdmin("/api/exports", { moduleKey });
      setNotice(
        "Export queued. Open Reports to check progress and download when ready.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const fields =
    m.fields?.filter(
      (key) =>
        !["public_url", "alt_text", "visibility"].includes(key) &&
        (key !== "id" ||
          moduleKey === "reports" ||
          moduleKey === "payments" ||
          moduleKey === "refunds" ||
          moduleKey === "support"),
    ) || [];
  const statuses =
    (
      {
        inventory: [
          "PRINTED",
          "WITH_DISTRIBUTOR",
          "WITH_RETAILER",
          "SOLD",
          "ACTIVATED",
          "BLOCKED",
          "REPLACED",
        ],
        orders: [
          "CREATED",
          "PENDING_PAYMENT",
          "PAID",
          "PROCESSING",
          "SHIPPED",
          "DELIVERED",
          "CANCELLED",
        ],
        payments: ["CREATED", "PENDING", "SUCCESS", "FAILED", "REFUNDED"],
        support: [
          "OPEN",
          "IN_PROGRESS",
          "WAITING_CUSTOMER",
          "RESOLVED",
          "CLOSED",
        ],
        subscriptions: [
          "CREATED",
          "PENDING_PAYMENT",
          "ACTIVE",
          "PAST_DUE",
          "CANCELLED",
          "EXPIRED",
        ],
        incidents: ["INVESTIGATING", "IDENTIFIED", "MONITORING", "RESOLVED"],
      } as Record<string, string[]>
    )[moduleKey] || [];
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <div className="admin-eyebrow">{m.group}</div>
          <h1>{m.label}</h1>
          <p>{m.description}</p>
        </div>
        <div className="admin-actions">
          <button
            className="admin-button"
            onClick={() => void refresh(data?.page || 1)}
            disabled={busy}
          >
            <VaahanIcon name="refresh" size={14} />
            Refresh
          </button>
          {writable && (
            <button
              className="admin-button primary"
              onClick={() => startEdit()}
            >
              <VaahanIcon name="plus" size={14} />
              New{" "}
              {m.action === "partner"
                ? "partner"
                : m.action === "support"
                  ? "ticket"
                  : m.action === "incident"
                    ? "incident"
                    : m.action === "flag"
                      ? "flag"
                      : "document"}
            </button>
          )}
        </div>
      </div>
      {moduleKey === "incidents" && <MonitoringPanel />}
      {(error || loadError) && (
        <div className="admin-notice error" role="alert">
          <VaahanIcon name="alert" size={16} />
          <span>{error || loadError}</span>
          <button className="admin-link" onClick={() => void refresh()}>
            Try again
          </button>
        </div>
      )}
      {notice && (
        <div className="admin-notice" role="status">
          <VaahanIcon name="check" size={16} />
          <span>{notice}</span>
        </div>
      )}
      {moduleKey === "payments" ||
      moduleKey === "orders" ||
      moduleKey === "refunds" ? (
        <div className="admin-notice">
          <VaahanIcon name="eye-off" size={16} />
          <span>
            Financial state is confirmed by the payment provider. This workspace
            cannot mark an order paid or grant service access.
          </span>
        </div>
      ) : null}
      <section className="admin-panel" data-aos="fade-up">
        <form
          className="admin-toolbar"
          onSubmit={(e) => {
            e.preventDefault();
            void refresh();
          }}
        >
          <input
            aria-label={`Search ${m.label}`}
            placeholder={
              m.search?.length
                ? `Search ${m.label.toLowerCase()} by reference…`
                : "Filter records by status"
            }
            disabled={!m.search?.length}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {m.statusField && (
            <AdminSelect
              label="Record status"
              value={status}
              onValueChange={setStatus}
              options={[
                { value: "", label: "All statuses" },
                ...[
                  ...new Set([
                    ...statuses,
                    status,
                    ...(data?.rows.map((r) =>
                      String(r[m.statusField!] || ""),
                    ) || []),
                  ]),
                ]
                  .filter(Boolean)
                  .map((s) => ({ value: s, label: s.replaceAll("_", " ") })),
              ]}
            />
          )}
          <button className="admin-button" disabled={busy} type="submit">
            <VaahanIcon name="filter" size={13} />
            Apply
          </button>
          {[
            "SUPER_ADMIN",
            "OPS_ADMIN",
            "FINANCE_ADMIN",
            "READ_ONLY_ANALYST",
          ].includes(identity.role) &&
            !["reports", "audit"].includes(moduleKey) && (
              <button
                className="admin-button"
                disabled={busy}
                type="button"
                onClick={() => void queueExport()}
              >
                <VaahanIcon name="download" size={13} />
                Export
              </button>
            )}
        </form>
        {inventoryWrite && selected.length > 0 && (
          <div className="admin-toolbar">
            <span>{selected.length} selected</span>
            <button
              className="admin-button danger"
              disabled={busy}
              onClick={() => void previewBlock()}
            >
              Preview block
            </button>
            <button className="admin-link" onClick={() => setSelected([])}>
              Clear selection
            </button>
          </div>
        )}
        <div className="admin-data-caption" role="status">
          <span>
            {records.isFetching
              ? "Updating records…"
              : data
                ? "Latest records loaded"
                : "Waiting for records"}
          </span>
          <span>
            {data
              ? `${Math.min((data.page - 1) * data.pageSize + 1, data.total)}–${Math.min(data.page * data.pageSize, data.total)} of ${data.total.toLocaleString("en-IN")}`
              : ""}
          </span>
        </div>
        {moduleKey === "gallery" && (
          <MediaGallery
            rows={data?.rows || []}
            onUpload={() => void refresh()}
          />
        )}
        {busy && !data ? (
          <div className="admin-loading" role="status">
            Loading records…
          </div>
        ) : data?.rows.length ? (
          <RecordTable
            rows={data.rows}
            fields={fields}
            onInspect={(row) => {
              setInspect(row);
              setDialogError("");
            }}
            selected={selected}
            onSelect={
              inventoryWrite
                ? (id) =>
                    setSelected((current) =>
                      current.includes(id)
                        ? current.filter((s) => s !== id)
                        : [...current, id],
                    )
                : undefined
            }
          />
        ) : !error && !loadError ? (
          <div className="admin-empty">
            <VaahanIcon name={m.icon} size={27} />
            <h3>
              {filters.q || filters.status
                ? "No matching records"
                : moduleKey === "incidents"
                  ? "No incidents recorded"
                  : "No records yet"}
            </h3>
            <p>
              {filters.q || filters.status
                ? "Try another reference or clear the status filter."
                : "Records will appear here when they are created in the platform."}
            </p>
          </div>
        ) : null}
        <div className="admin-table-foot">
          <span>
            {data
              ? `${data.total.toLocaleString("en-IN")} records · Page ${data.page} of ${Math.max(1, Math.ceil(data.total / data.pageSize))}`
              : "Records unavailable"}
          </span>
          <div className="admin-actions">
            <button
              className="admin-button"
              disabled={busy || !data || data.page <= 1}
              onClick={() => void refresh((data?.page || 1) - 1)}
            >
              ← Previous
            </button>
            <button
              className="admin-button"
              disabled={
                busy || !data || data.page * data.pageSize >= data.total
              }
              onClick={() => void refresh((data?.page || 1) + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      </section>
      {(inspect || editing || preview) && (
        <AdminDialog
          title={
            preview
              ? "Review inventory block"
              : editing
                ? `Manage ${m.label.toLowerCase()}`
                : "Record details"
          }
          onClose={closeDialog}
        >
          {stepUp ? (
            <EmailVerification
              stepUp
              onVerified={() => {
                setStepUp(false);
                setDialogError(
                  "Email verified. Review and confirm your action again.",
                );
              }}
            />
          ) : preview ? (
            <>
              <p>
                This action blocks <strong>{preview.count}</strong> QR
                identities and makes their safety resolver unavailable. Review
                the affected records below.
              </p>
              <RecordTable
                rows={preview.rows}
                fields={["visible_code", "status", "lifecycle_state"]}
              />
              <label className="admin-section-label" htmlFor="block-reason">
                Operational reason
              </label>
              <textarea
                id="block-reason"
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe why these QR identities must be blocked…"
              />
              <label>
                <input
                  type="checkbox"
                  style={{ width: "auto", marginRight: 8 }}
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                I have reviewed all {preview.count} affected identities.
              </label>
              <div className="admin-actions">
                <button className="admin-button" onClick={closeDialog}>
                  Cancel
                </button>
                <button
                  className="admin-button danger"
                  disabled={busy || !confirmed || reason.trim().length < 10}
                  onClick={() => void block()}
                >
                  Confirm block of {preview.count}
                </button>
              </div>
            </>
          ) : editing ? (
            <>
              <p>
                Review the fields and add a reason. The server checks your
                permission and records the change.
              </p>
              {editFields[m.action || ""]?.map((f) => (
                <div key={f.key}>
                  <label htmlFor={`edit-${f.key}`}>{f.label}</label>
                  {f.options ? (
                    <AdminSelect
                      id={`edit-${f.key}`}
                      label={f.label}
                      value={values[f.key] || f.options[0]!}
                      onValueChange={(value) =>
                        setValues((v) => ({ ...v, [f.key]: value }))
                      }
                      options={f.options.map((o) => ({
                        value: o,
                        label: o.replaceAll("_", " "),
                      }))}
                    />
                  ) : f.type === "textarea" ? (
                    <textarea
                      id={`edit-${f.key}`}
                      value={values[f.key] || ""}
                      maxLength={2000}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [f.key]: e.target.value }))
                      }
                    />
                  ) : (
                    <input
                      id={`edit-${f.key}`}
                      value={values[f.key] || ""}
                      maxLength={2000}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [f.key]: e.target.value }))
                      }
                    />
                  )}
                </div>
              ))}
              <label htmlFor="edit-reason">Reason for this change</label>
              <textarea
                id="edit-reason"
                value={reason}
                maxLength={500}
                onChange={(e) => setReason(e.target.value)}
              />
              <label>
                <input
                  type="checkbox"
                  style={{ width: "auto", marginRight: 8 }}
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                I have reviewed this change.
              </label>
              <div className="admin-actions">
                <button className="admin-button" onClick={closeDialog}>
                  Cancel
                </button>
                <button
                  className="admin-button primary"
                  disabled={
                    busy ||
                    !confirmed ||
                    reason.trim().length < 10 ||
                    Object.values(values).some((v) => !v.trim())
                  }
                  onClick={() => void applyEdit()}
                >
                  Confirm and save
                </button>
              </div>
            </>
          ) : inspect ? (
            <>
              <div className="admin-detail-grid">
                {Object.entries(inspect).map(([key, value]) => (
                  <div className="admin-field" key={key}>
                    <label>{columnLabel(key)}</label>
                    <p>{displayValue(key, value, inspect)}</p>
                  </div>
                ))}
              </div>
              <div className="admin-actions">
                {moduleKey === "reports" && inspect.status === "READY" && (
                  <a
                    className="admin-button primary"
                    href={`/api/exports/${inspect.id}`}
                  >
                    Download private export
                  </a>
                )}
                {writable && (
                  <button
                    className="admin-button primary"
                    onClick={() => startEdit(inspect)}
                  >
                    Edit record
                  </button>
                )}
                <button className="admin-button" onClick={closeDialog}>
                  Close
                </button>
              </div>
            </>
          ) : null}
          {dialogError && (
            <div
              className="admin-notice error"
              role="alert"
              style={{ marginTop: 15 }}
            >
              {dialogError}
            </div>
          )}
        </AdminDialog>
      )}
    </>
  );
}
