"use client";
import { useId, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@vaahansafe/ui/components/sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@vaahansafe/ui/components/alert-dialog";
import { AdminDialog } from "../../../components/AdminDialog";
import { GeographyCombobox } from "../../geography/GeographyCombobox";
import { changePartnerState } from "../../geography/geography.types";
import { mutateNetwork } from "../../network/mutation";
import { retailerSchema } from "../retailer.schema";
import { VaahanIcon } from "@vaahansafe/icons";
import type {
  RetailerDetail,
  RetailerInput,
  DistributorOption,
} from "../retailer.types";
import { DistributorCombobox } from "./DistributorCombobox";
const EMPTY: RetailerInput = {
  name: "",
  legal_name: "",
  parent_distributor_id: "",
  state_code: "",
  district_code: "",
  city: "",
  postal_code: "",
  address_line_1: "",
  address_line_2: "",
  landmark: "",
  contact_name: "",
  contact_phone: "",
  contact_email: "",
  notes: "",
  stock_threshold: 0,
  territory_override: false,
  reason: "",
};
const STEPS = [
  "Business",
  "Distributor",
  "Location",
  "Contact",
  "Operations",
  "Review",
];
const STEP_FIELDS: (keyof RetailerInput)[][] = [
  ["name", "legal_name", "notes"],
  ["parent_distributor_id"],
  [
    "state_code",
    "district_code",
    "city",
    "postal_code",
    "address_line_1",
    "address_line_2",
    "landmark",
  ],
  ["contact_name", "contact_phone", "contact_email"],
  ["stock_threshold"],
  ["reason"],
];
export function RetailerForm({
  open,
  onClose,
  detail,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  detail?: RetailerDetail;
  onSaved?: (id: string) => void;
}) {
  const [values, setValues] = useState<RetailerInput>(() =>
      detail
        ? (Object.fromEntries(
            Object.keys(EMPTY).map((k) => [
              k,
              k === "reason"
                ? ""
                : k === "territory_override"
                  ? false
                  : (detail.retailer[k as keyof typeof detail.retailer] ??
                    EMPTY[k as keyof RetailerInput]),
            ]),
          ) as unknown as RetailerInput)
        : { ...EMPTY },
    ),
    [parent, setParent] = useState<DistributorOption | null>(
      detail?.parent || null,
    ),
    [step, setStep] = useState(0),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [failure, setFailure] = useState(""),
    [busy, setBusy] = useState(false),
    [confirm, setConfirm] = useState(false),
    id = useId(),
    client = useQueryClient();
  const outside =
    !!parent &&
    !!values.district_code &&
    !parent.territories.some(
      (t) =>
        t.state_code === values.state_code &&
        t.district_code === values.district_code,
    );
  const set = <K extends keyof RetailerInput>(k: K, v: RetailerInput[K]) =>
    setValues((x) => ({
      ...x,
      [k]: v,
      ...(["parent_distributor_id", "state_code", "district_code"].includes(k)
        ? { territory_override: false }
        : {}),
    }));
  const field = (
    k: keyof RetailerInput,
    label: string,
    required = false,
    type = "text",
  ) => (
    <div className="dist-field">
      <label htmlFor={`${id}-${k}`}>
        {label}
        {required ? " *" : ""}
      </label>
      <input
        id={`${id}-${k}`}
        type={type}
        value={String(values[k])}
        onChange={(e) =>
          set(
            k,
            k === "stock_threshold"
              ? Number(e.target.value)
              : (e.target.value as never),
          )
        }
        aria-invalid={!!errors[k]}
        aria-describedby={errors[k] ? `${id}-${k}-error` : undefined}
        autoComplete={
          k === "contact_phone"
            ? "tel"
            : k === "contact_email"
              ? "email"
              : "off"
        }
      />
      {errors[k] && (
        <small id={`${id}-${k}-error`} className="retail-field-error">
          {errors[k]}
        </small>
      )}
    </div>
  );
  const validate = (all = false) => {
    const r = retailerSchema.safeParse(values),
      next: Record<string, string> = {};
    if (!r.success)
      r.error.issues.forEach((e) => {
        const k = String(e.path[0]);
        if (all || STEP_FIELDS[step]?.includes(k as keyof RetailerInput))
          next[k] = e.message;
      });
    if ((all || step === 1) && parent?.status !== "ACTIVE")
      next.parent_distributor_id = "Choose an active supplying distributor.";
    if ((all || step === 5) && outside && !values.territory_override)
      next.territory_override = "Review and acknowledge the territory warning.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const save = async () => {
    if (!validate(true)) return;
    setBusy(true);
    setFailure("");
    try {
      const data = await mutateNetwork(
        detail ? `/api/retailers/${detail.retailer.id}` : "/api/retailers",
        { values, updatedAt: detail?.retailer.updated_at },
        detail ? "PATCH" : "POST",
      );
      await Promise.all([
        client.invalidateQueries({ queryKey: ["retailers"] }),
        client.invalidateQueries({ queryKey: ["distributors"] }),
        client.invalidateQueries({ queryKey: ["retailer-distributor-search"] }),
      ]);
      toast.success(detail ? "Retailer updated" : "Retailer created", {
        description: `${values.name} ${detail ? "was updated." : "was added to the retail network."}`,
        action: {
          label: "View retailer",
          onClick: () => window.location.assign(`/retailers/${data.id}`),
        },
      });
      setConfirm(false);
      onClose();
      onSaved?.(data.id);
    } catch (e) {
      setConfirm(false);
      setFailure((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const submit = () => {
    if (!validate(true)) return;
    if (
      outside ||
      (detail &&
        detail.retailer.parent_distributor_id !== values.parent_distributor_id)
    )
      setConfirm(true);
    else void save();
  };
  if (!open) return null;
  return (
    <>
      <AdminDialog
        onClose={() => {
          if (!busy) onClose();
        }}
        title={detail ? "Edit retailer" : "New retailer"}
        description="Local outlet, supplying distributor and operational setup."
        className="dist-form-dialog"
        footer={
          <div className="dist-dialog-footer">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="dist-btn dist-dialog-cancel"
            >
              Cancel
            </button>
            <div className="dist-dialog-footer-actions">
              {step > 0 && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setStep(step - 1)}
                  className="dist-btn dist-dialog-back"
                >
                  <VaahanIcon name="chevron-left" size={13} />
                  <span>Back</span>
                </button>
              )}
              <button
                className="dist-btn dist-primary dist-dialog-continue"
                type="button"
                disabled={busy}
                onClick={() => {
                  setFailure("");
                  if (step < 5) {
                    if (validate()) setStep(step + 1);
                  } else submit();
                }}
              >
                <span>
                  {busy
                    ? "Saving…"
                    : step === 5
                      ? detail
                        ? "Save retailer"
                        : "Create retailer"
                      : "Continue"}
                </span>
                {step < 5 && !busy && (
                  <VaahanIcon name="chevron-right" size={13} />
                )}
                {step === 5 && !busy && (
                  <VaahanIcon name="check" size={13} strokeWidth={2} />
                )}
              </button>
            </div>
          </div>
        }
      >
        <ol className="dist-steps" aria-label="Retailer setup steps">
          {STEPS.map((s, i) => {
            const isCurrent = i === step;
            const isDone = i < step;
            return (
              <li
                key={s}
                aria-current={isCurrent ? "step" : undefined}
                className={
                  isCurrent
                    ? "dist-step-current"
                    : isDone
                      ? "dist-step-done"
                      : ""
                }
              >
                <span>
                  {isDone ? (
                    <VaahanIcon name="check" size={10} strokeWidth={2.5} />
                  ) : (
                    i + 1
                  )}
                </span>
                {s}
              </li>
            );
          })}
        </ol>
        {failure && (
          <div role="alert" className="dist-error">
            {failure}
            {detail && (
              <button
                onClick={() =>
                  void client
                    .invalidateQueries({
                      queryKey: ["retailers", "detail", detail.retailer.id],
                    })
                    .then(onClose)
                }
              >
                Reload latest
              </button>
            )}
          </div>
        )}
        <div className="dist-form">
          {step === 0 && (
            <>
              <h3>Business details</h3>
              {field("name", "Retailer / outlet name", true)}
              {field("legal_name", "Legal name")}
              <div className="dist-field retail-wide">
                <label htmlFor={`${id}-notes`}>Internal note</label>
                <textarea
                  id={`${id}-notes`}
                  value={values.notes}
                  maxLength={2000}
                  onChange={(e) => set("notes", e.target.value)}
                />
              </div>
              <p>
                The retailer reference is generated on the server when saved.
              </p>
            </>
          )}
          {step === 1 && (
            <>
              <h3>Supply network</h3>
              <div className="retail-wide">
                <DistributorCombobox
                  value={values.parent_distributor_id}
                  initial={parent}
                  onChange={(v) => set("parent_distributor_id", v)}
                  onOption={setParent}
                />
                {errors.parent_distributor_id && (
                  <p role="alert" className="retail-field-error">
                    {errors.parent_distributor_id}
                  </p>
                )}
              </div>
              {parent && (
                <p>
                  Service territory:{" "}
                  {parent.territories.map((t) => t.district_name).join(", ") ||
                    "No districts configured."}
                </p>
              )}
              <p>
                Retailers are supplied by an existing active distributor.{" "}
                <a href="/distributors">Manage distributors</a>
              </p>
            </>
          )}
          {step === 2 && (
            <>
              <h3>Outlet location · India</h3>
              <GeographyCombobox
                label="State / Union Territory"
                required
                value={values.state_code}
                onChange={(s) =>
                  setValues((v) => ({
                    ...changePartnerState(v, s),
                    territory_override: false,
                  }))
                }
              />
              <GeographyCombobox
                label="District"
                required
                state={values.state_code}
                value={values.district_code}
                onChange={(v) => set("district_code", v)}
              />
              {(errors.state_code || errors.district_code) && (
                <p role="alert" className="retail-field-error">
                  Choose a valid state and its district.
                </p>
              )}
              {field("city", "Locality / city", true)}
              {field("postal_code", "Postal code")}
              {field("address_line_1", "Shop / building / street", true)}
              {field("address_line_2", "Address line 2")}
              {field("landmark", "Nearby landmark")}
              {outside && (
                <p className="dist-error">
                  This outlet is outside the selected distributor’s configured
                  service territory. Review the relationship and record an
                  override reason in the final step.
                </p>
              )}
            </>
          )}
          {step === 3 && (
            <>
              <h3>Primary contact</h3>
              {field("contact_name", "Owner / manager name", true)}
              {field("contact_phone", "Mobile", true, "tel")}
              {field("contact_email", "Email", false, "email")}
              <p>
                Contact details are restricted to operations administrators.
              </p>
            </>
          )}
          {step === 4 && (
            <>
              <h3>Operational settings</h3>
              {field("stock_threshold", "Low stock threshold", false, "number")}
              <p>
                Use 0 to leave the low stock threshold unset. Low stock is
                derived from available stock and does not change retailer
                status.
              </p>
              <p>
                {detail
                  ? `Current status: ${detail.retailer.status} · ${detail.retailer.verification_status}`
                  : "Initial status: Active · verification pending. Verify the retailer before sending stock."}
              </p>
            </>
          )}
          {step === 5 && (
            <>
              <h3>Review retailer</h3>
              <dl className="dist-review">
                <dt>Outlet</dt>
                <dd>{values.name}</dd>
                <dt>Supplied by</dt>
                <dd>
                  {parent?.name}
                  <br />
                  {parent?.reference_code}
                </dd>
                <dt>Location</dt>
                <dd>
                  {values.city} · {values.address_line_1}
                  <br />
                  {values.postal_code || "Postal code not provided"}
                </dd>
                <dt>Contact</dt>
                <dd>
                  {values.contact_name.slice(0, 1)}••• · ••••••
                  {values.contact_phone.replace(/\D/g, "").slice(-4)}
                </dd>
                <dt>Stock threshold</dt>
                <dd>{values.stock_threshold || "Not set"}</dd>
              </dl>
              {outside && (
                <div className="dist-error retail-wide">
                  <p>
                    This outlet is outside the distributor’s configured service
                    territory. Operations administrators may record a reasoned
                    exception; coverage remains non-exclusive.
                  </p>
                  <label className="retail-check">
                    <input
                      type="checkbox"
                      checked={values.territory_override}
                      onChange={(e) =>
                        set("territory_override", e.target.checked)
                      }
                    />
                    I reviewed this supply relationship and authorize the
                    territory exception.
                  </label>
                  {errors.territory_override && (
                    <p role="alert">{errors.territory_override}</p>
                  )}
                </div>
              )}
              <div className="dist-field retail-wide">
                <label htmlFor={`${id}-reason`}>
                  Reason / onboarding reference *
                </label>
                <textarea
                  id={`${id}-reason`}
                  value={values.reason}
                  maxLength={500}
                  onChange={(e) => set("reason", e.target.value)}
                  aria-invalid={!!errors.reason}
                  aria-describedby={
                    errors.reason ? `${id}-reason-error` : undefined
                  }
                />
                {errors.reason && (
                  <small
                    id={`${id}-reason-error`}
                    className="retail-field-error"
                  >
                    Enter a reason of 10–500 characters.
                  </small>
                )}
              </div>
            </>
          )}
        </div>
      </AdminDialog>
      <AlertDialog
        open={confirm}
        onOpenChange={(o) => {
          if (!busy) setConfirm(o);
        }}
      >
        <AlertDialogContent className="dist-alert">
          <AlertDialogTitle>Confirm supply network change</AlertDialogTitle>
          <AlertDialogDescription>
            Save {values.name} under {parent?.name}
            {outside
              ? " outside the currently configured service territory"
              : ""}
            . Existing QR custody and activation rights are unchanged. The
            reason is recorded in the audit trail.
          </AlertDialogDescription>
          <div className="dist-actions">
            <AlertDialogCancel disabled={busy}>Go back</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void save();
              }}
            >
              {busy ? "Saving…" : "Confirm and save"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
