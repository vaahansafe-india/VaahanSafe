"use client";
import { useEffect, useId, useState } from "react";
import { GeographyCombobox } from "../../geography/GeographyCombobox";
import { AdminSelect } from "../../../components/AdminSelect";
import { DistributorCombobox } from "./DistributorCombobox";
import { EMPTY_RETAILER_FILTERS } from "../retailer.filters";
import type { RetailerFilters as Filters } from "../retailer.types";
export function RetailerFilters({
  value,
  onChange,
}: {
  value: Filters;
  onChange: (v: Filters) => void;
}) {
  const id = useId(),
    [locality, setLocality] = useState(value.locality);
  useEffect(() => setLocality(value.locality), [value.locality]);
  const select = (
    key: keyof Filters,
    label: string,
    options: [string, string][],
  ) => (
    <div className="dist-field">
      <label>{label}</label>
      <AdminSelect
        label={label}
        value={value[key]}
        onValueChange={(v) => onChange({ ...value, [key]: v })}
        options={[
          { value: "", label: "Any" },
          ...options.map(([value, label]) => ({ value, label })),
        ]}
      />
    </div>
  );
  return (
    <div className="dist-filters">
      <div className="dist-filter-heading">
        <strong>Filter retailers</strong>
        <button
          onClick={() => {
            setLocality("");
            onChange(EMPTY_RETAILER_FILTERS);
          }}
        >
          Clear all
        </button>
      </div>
      {select("status", "Status", [
        ["ACTIVE", "Active"],
        ["SUSPENDED", "Suspended"],
      ])}
      {select("verification", "Verification", [
        ["PENDING", "Pending onboarding"],
        ["VERIFIED", "Verified"],
        ["REQUIRES_CORRECTION", "Requires correction"],
      ])}
      <GeographyCombobox
        label="State"
        value={value.state}
        allowClear
        onChange={(state) =>
          onChange({
            ...value,
            state,
            district: value.state === state ? value.district : "",
          })
        }
      />
      <GeographyCombobox
        label="District"
        state={value.state}
        value={value.district}
        allowClear
        onChange={(district) => onChange({ ...value, district })}
      />
      <form
        className="dist-field"
        onSubmit={(e) => {
          e.preventDefault();
          onChange({ ...value, locality });
        }}
      >
        <label htmlFor={`${id}-locality`}>Locality / city</label>
        <input
          id={`${id}-locality`}
          value={locality}
          onChange={(e) => setLocality(e.target.value)}
          placeholder="Enter locality…"
        />
        <button>Apply locality</button>
      </form>
      <DistributorCombobox
        label="Distributor"
        value={value.distributor}
        allowClear
        onChange={(distributor) => onChange({ ...value, distributor })}
      />
      {select("inventory", "Inventory", [
        ["held", "In stock"],
        ["low", "Low stock"],
        ["empty", "Out of stock"],
        ["transit", "Stock incoming"],
        ["variance", "Reconciliation issue"],
      ])}
      {select("activity", "Activation activity", [
        ["today", "Activated today"],
        ["week", "Active in last 7 days"],
        ["quiet", "No activations in 30 days"],
      ])}
      <fieldset>
        <legend>Created</legend>
        {(["from", "to"] as const).map((k) => (
          <div key={k} className="dist-field">
            <label htmlFor={`${id}-${k}`}>{k === "from" ? "From" : "To"}</label>
            <input
              id={`${id}-${k}`}
              type="date"
              value={value[k]}
              onChange={(e) => onChange({ ...value, [k]: e.target.value })}
            />
          </div>
        ))}
      </fieldset>
    </div>
  );
}
