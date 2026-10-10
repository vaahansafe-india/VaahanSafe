"use client";
import { useId } from "react";
import { GeographyCombobox } from "./GeographyCombobox";
import { AdminSelect } from "../../../components/AdminSelect";
import { AdminDatePicker } from "../../../components/AdminDatePicker";
import { EMPTY_DISTRIBUTOR_FILTERS } from "../distributor.filters";
import type { DistributorFilters as Filters } from "../distributor.types";
import { VaahanIcon } from "@vaahansafe/icons";
export function DistributorFilters({
  value,
  onChange,
}: {
  value: Filters;
  onChange: (v: Filters) => void;
}) {
  const fieldId = useId();
  const select = (
    key: keyof Filters,
    label: string,
    options: { value: string; label: string }[],
  ) => (
    <div className="dist-field">
      <label>{label}</label>
      <AdminSelect
        label={label}
        value={value[key]}
        onValueChange={(v) => onChange({ ...value, [key]: v })}
        options={[{ value: "", label: "Any" }, ...options]}
      />
    </div>
  );
  return (
    <div className="dist-filters">
      <div className="dist-filter-heading">
        <strong>Filter network</strong>
        <button
          type="button"
          className="dist-filter-clear-btn"
          onClick={() => onChange(EMPTY_DISTRIBUTOR_FILTERS)}
          title="Reset all filters"
        >
          <VaahanIcon name="close" size={10} />
          <span>Clear all</span>
        </button>
      </div>
      {select("status", "Status", [
        { value: "ACTIVE", label: "Active" },
        { value: "SUSPENDED", label: "Suspended" },
      ])}
      {select("verification", "Verification", [
        { value: "VERIFIED", label: "Verified" },
        { value: "PENDING", label: "Pending onboarding" },
        { value: "REQUIRES_CORRECTION", label: "Requires correction" },
      ])}
      <GeographyCombobox
        label="State"
        allowClear
        value={value.state}
        onChange={(s) =>
          onChange({
            ...value,
            state: s,
            district: value.state === s ? value.district : "",
          })
        }
      />
      <GeographyCombobox
        label="District"
        allowClear
        state={value.state}
        value={value.district}
        onChange={(district) => onChange({ ...value, district })}
      />
      {select("inventory", "Inventory", [
        { value: "held", label: "Has inventory" },
        { value: "empty", label: "No inventory" },
        { value: "transit", label: "In transit" },
        { value: "variance", label: "Reconciliation issue" },
      ])}
      {select("network", "Retailer network", [
        { value: "retailers", label: "Has retailers" },
        { value: "none", label: "No retailers" },
      ])}
      <fieldset className="dist-fieldset">
        <legend>Created</legend>
        {(["from", "to"] as const).map((k) => (
          <div className="dist-field" key={k}>
            <label htmlFor={`${fieldId}-created-${k}`}>
              {k === "from" ? "From" : "To"}
            </label>
            <AdminDatePicker
              id={`${fieldId}-created-${k}`}
              label={k === "from" ? "Created from date" : "Created to date"}
              placeholder={k === "from" ? "From date…" : "To date…"}
              value={value[k]}
              onChange={(dateStr) => onChange({ ...value, [k]: dateStr })}
            />
          </div>
        ))}
      </fieldset>
    </div>
  );
}
