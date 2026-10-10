"use client";
import { useState } from "react";
import { toast } from "@vaahansafe/ui/components/sonner";
import { AdminDialog } from "../../../components/AdminDialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@vaahansafe/ui/components/alert-dialog";
import { GeographyCombobox } from "./GeographyCombobox";
import { changeDistributorState } from "../distributor.filters";
import { distributorSchema } from "../distributor.schema";
import { VaahanIcon } from "@vaahansafe/icons";
import type {
  DistributorDetail,
  DistributorInput,
  Territory,
} from "../distributor.types";
export async function mutateDistributor(
  url: string,
  body: unknown,
  method = "POST",
) {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "We couldn't complete this action right now. Please try again.",
    );
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(
      "We couldn't complete this action right now. Please try again.",
    );
  }
  if (!response.ok || !result.success)
    throw new Error(
      result.error?.message ||
        "We couldn't save this change. Please try again.",
    );
  return result.data;
}
const EMPTY: DistributorInput = {
  name: "",
  legal_name: "",
  state_code: "",
  district_code: "",
  city: "",
  postal_code: "",
  address_line_1: "",
  address_line_2: "",
  landmark: "",
  contact_name: "",
  contact_role: "",
  contact_phone: "",
  contact_email: "",
  notes: "",
  territories: [],
  reason: "",
};
const STEPS = ["Organization", "Location", "Contact", "Territory", "Review"];
function initialFormValues(detail?: DistributorDetail): DistributorInput {
  const values: DistributorInput = {
    ...EMPTY,
    territories:
      detail?.territories.map(({ state_code, district_code }) => ({
        state_code,
        district_code,
      })) || [],
  };
  if (detail)
    for (const key of Object.keys(EMPTY) as (keyof DistributorInput)[]) {
      if (key !== "territories" && key !== "reason")
        values[key] = detail.distributor[key] || "";
    }
  return values;
}
export function DistributorForm({
  detail,
  onClose,
  onSaved,
}: {
  detail?: DistributorDetail;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const [values, setValues] = useState<DistributorInput>(() =>
      initialFormValues(detail),
    ),
    [step, setStep] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [area, setArea] = useState<Territory>({
      state_code: "",
      district_code: "",
    });
  const [removingArea, setRemovingArea] = useState<string | null>(null);
  const set = (key: keyof DistributorInput, value: string) =>
    setValues((v) => ({ ...v, [key]: value }));
  const field = (
    key: keyof Omit<DistributorInput, "territories">,
    label: string,
    required = false,
    type = "text",
  ) => {
    const isTextarea = key === "notes" || key === "reason";
    const isFullWidth =
      isTextarea ||
      key === "address_line_1" ||
      key === "address_line_2" ||
      key === "landmark";
    return (
      <div
        className={`dist-field ${isFullWidth ? "dist-field-full" : ""}`}
        key={key}
      >
        <label htmlFor={`distributor-${key}`}>
          {label}
          {required ? " *" : ""}
        </label>
        {isTextarea ? (
          <textarea
            id={`distributor-${key}`}
            value={values[key]}
            rows={key === "notes" ? 3 : 2}
            maxLength={key === "notes" ? 2000 : 500}
            placeholder={
              key === "notes"
                ? "Optional operational notes, partner background or onboarding directives…"
                : "Required operational reason for audit log (10–500 characters)…"
            }
            onChange={(e) => set(key, e.target.value)}
            aria-describedby={error ? "distributor-form-error" : undefined}
          />
        ) : (
          <input
            id={`distributor-${key}`}
            type={type}
            value={values[key]}
            required={required}
            maxLength={254}
            onChange={(e) => set(key, e.target.value)}
            aria-describedby={error ? "distributor-form-error" : undefined}
          />
        )}
      </div>
    );
  };
  const next = () => {
    const checks = [
      values.name.trim().length >= 2,
      !!values.state_code &&
        !!values.district_code &&
        values.city.trim().length >= 2 &&
        /^[1-9]\d{5}$/.test(values.postal_code) &&
        values.address_line_1.trim().length >= 3,
      values.contact_name.trim().length >= 2 &&
        /^(?:\+91)?[6-9]\d{9}$/.test(
          values.contact_phone.replace(/[\s()-]/g, ""),
        ) &&
        (!values.contact_email ||
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contact_email)),
      values.territories.length > 0,
    ];
    if (!checks[step]) {
      setError("Complete the required fields in this step before continuing.");
      return;
    }
    setError("");
    setStep(step + 1);
  };
  const save = async () => {
    const parsed = distributorSchema.safeParse(values);
    if (!parsed.success) {
      setError(
        "Check all required fields and provide an operational reason of 10–500 characters.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await mutateDistributor(
        detail
          ? `/api/distributors/${detail.distributor.id}`
          : "/api/distributors",
        { values: parsed.data, updatedAt: detail?.distributor.updated_at },
        detail ? "PATCH" : "POST",
      );
      toast.success(detail ? "Distributor updated" : "Distributor created", {
        description: detail
          ? "Contact and territory changes were saved."
          : "Regional partner is ready for onboarding.",
      });
      onSaved(result.id);
    } catch (e) {
      setError((e as Error).message);
      toast.error("Could not save distributor", {
        description: (e as Error).message,
      });
    } finally {
      setBusy(false);
    }
  };
  return (
    <AdminDialog
      title={detail ? "Edit distributor" : "New distributor"}
      description="Create a regional distribution partner with a physical location and separate service territory."
      className="dist-form-dialog"
      onClose={() => {
        if (!busy) onClose();
      }}
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
                onClick={() => {
                  setStep(step - 1);
                  setError("");
                }}
                className="dist-btn dist-dialog-back"
              >
                <VaahanIcon name="chevron-left" size={13} />
                <span>Back</span>
              </button>
            )}
            <button
              type="button"
              className="dist-btn dist-primary dist-dialog-continue"
              disabled={busy}
              onClick={step === 4 ? save : next}
            >
              <span>
                {busy
                  ? "Saving…"
                  : step === 4
                    ? detail
                      ? "Save distributor"
                      : "Create distributor"
                    : "Continue"}
              </span>
              {step < 4 && !busy && (
                <VaahanIcon name="chevron-right" size={13} />
              )}
              {step === 4 && !busy && (
                <VaahanIcon name="check" size={13} strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
      }
    >
      <ol className="dist-steps" aria-label="Distributor setup steps">
        {STEPS.map((name, i) => {
          const isCurrent = step === i;
          const isDone = i < step;
          return (
            <li
              key={name}
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
              {name}
            </li>
          );
        })}
      </ol>
      <form
        className="dist-form"
        onSubmit={(e) => {
          e.preventDefault();
          step === 4 ? void save() : next();
        }}
      >
        {step === 0 && (
          <>
            <h3>Organization</h3>
            <p>
              Distributor references are generated securely by the server. New
              partners await verification.
            </p>
            {field("name", "Distributor name", true)}
            {field("legal_name", "Legal / registered name")}
            {field("notes", "Internal notes")}
          </>
        )}
        {step === 1 && (
          <>
            <h3>Physical location</h3>
            <p>
              Country: India. Locality and landmarks are address context,
              separate from administrative districts.
            </p>
            <GeographyCombobox
              label="State / Union Territory"
              required
              value={values.state_code}
              onChange={(s) => setValues((v) => changeDistributorState(v, s))}
            />
            <GeographyCombobox
              label="District"
              required
              state={values.state_code}
              value={values.district_code}
              onChange={(d) => set("district_code", d)}
            />
            {field("city", "Locality / city", true)}
            {field("postal_code", "Postal code", true)}
            {field("address_line_1", "Address line 1", true)}
            {field("address_line_2", "Address line 2")}
            {field("landmark", "Nearby landmark")}
          </>
        )}
        {step === 2 && (
          <>
            <h3>Primary contact</h3>
            {field("contact_name", "Contact name", true)}
            {field("contact_role", "Role")}
            {field("contact_phone", "Indian mobile (+91)", true, "tel")}
            {field("contact_email", "Email", false, "email")}
          </>
        )}
        {step === 3 && (
          <>
            <h3>Service territory</h3>
            <p>
              Coverage may include several districts and may differ from the
              physical address. Territory assignments are non-exclusive.
            </p>
            <GeographyCombobox
              label="Service state"
              value={area.state_code}
              onChange={(s) => setArea((v) => changeDistributorState(v, s))}
            />
            <GeographyCombobox
              label="Service district"
              state={area.state_code}
              value={area.district_code}
              onChange={(d) => setArea((v) => ({ ...v, district_code: d }))}
            />
            <div className="dist-add-territory-wrap">
              <button
                type="button"
                className="dist-btn dist-add-territory-btn"
                disabled={!area.district_code || values.territories.length >= 30}
                onClick={() => {
                  if (
                    !values.territories.some(
                      (t) => t.district_code === area.district_code,
                    )
                  ) {
                    setValues((v) => ({
                      ...v,
                      territories: [...v.territories, area],
                    }));
                    setArea((v) => ({ ...v, district_code: "" }));
                  }
                }}
              >
                <VaahanIcon name="plus" size={13} />
                <span>Add service area</span>
              </button>
            </div>
            {values.territories.length === 0 ? (
              <div className="dist-territory-empty">
                <span>
                  No service territories added yet. Select a state and district
                  above and click <strong>Add service area</strong>. At least one
                  coverage district is required.
                </span>
              </div>
            ) : (
              <div className="dist-territory-list">
                {values.territories.map((t) => (
                  <div key={t.district_code}>
                    <TerritoryLabel area={t} />
                    <button
                      type="button"
                      className="dist-btn dist-territory-remove-btn"
                      aria-label="Remove service area"
                      onClick={() => setRemovingArea(t.district_code)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {step === 4 && (
          <>
            <h3>Review {values.name}</h3>
            <dl className="dist-review">
              <dt>Physical location</dt>
              <dd>
                {values.city}, {values.postal_code}
                <br />
                {values.address_line_1}
                <br />
                {values.landmark}
              </dd>
              <dt>Primary contact</dt>
              <dd>
                {values.contact_name} · {values.contact_phone}
                <br />
                {values.contact_email}
              </dd>
              <dt>Service territory</dt>
              <dd>
                {values.territories.map((t) => (
                  <TerritoryLabel key={t.district_code} area={t} />
                ))}
              </dd>
              <dt>Verification</dt>
              <dd>
                {detail
                  ? detail.distributor.verification_status
                  : "Pending onboarding review"}
              </dd>
            </dl>
            {field("reason", "Operational reason (10–500 characters)", true)}
            <p>
              {detail
                ? "This saves the organization, location, contact and coverage changes together."
                : "This creates a regional distribution partner. Inventory is assigned through a separate stock transfer workflow."}
            </p>
          </>
        )}
        {error && (
          <p role="alert" id="distributor-form-error" className="dist-error">
            {error}
          </p>
        )}
      </form>
      <AlertDialog
        open={!!removingArea}
        onOpenChange={(open) => {
          if (!open) setRemovingArea(null);
        }}
      >
        <AlertDialogContent className="dist-alert">
          <AlertDialogTitle>Remove service territory?</AlertDialogTitle>
          <AlertDialogDescription>
            This area will be removed from the proposed coverage. The change
            takes effect when you review and save the distributor.
          </AlertDialogDescription>
          <div className="dist-actions">
            <AlertDialogCancel>Keep area</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setValues((v) => ({
                  ...v,
                  territories: v.territories.filter(
                    (t) => t.district_code !== removingArea,
                  ),
                }));
                setRemovingArea(null);
              }}
            >
              Remove area
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </AdminDialog>
  );
}
import { useQuery } from "@tanstack/react-query";
import { getAdminData } from "../../../lib/client-api";
import type { GeographyOption } from "../distributor.types";
export function TerritoryLabel({ area }: { area: Territory }) {
  const { data } = useQuery({
    queryKey: ["distributor-geography", area.state_code],
    queryFn: ({ signal }) =>
      getAdminData<GeographyOption[]>(
        `/api/distributors/geography?state=${encodeURIComponent(area.state_code)}`,
        signal,
      ),
    staleTime: 86400000,
  });
  return (
    <span className="dist-territory-label">
      {area.district_name ||
        data?.find((d) => d.code === area.district_code)?.name ||
        "Loading service area…"}{" "}
      · {area.state_name || area.state_code}
    </span>
  );
}
