"use client";
import type { InventoryFilters, InventoryFacets } from "../inventory.types";
import { INVENTORY_STATUSES } from "../inventory.filters";
import { AdminSelect } from "../../../components/AdminSelect";
import { AdminDatePicker } from "../../../components/AdminDatePicker";
export const stateLabel = (s: string) =>
  s
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (c) => c.toUpperCase());
export function InventoryFilterRail({
  filters,
  facets,
  onChange,
}: {
  filters: InventoryFilters;
  facets?: InventoryFacets;
  onChange: (f: InventoryFilters) => void;
}) {
  const change = (key: keyof InventoryFilters, value: string) =>
    onChange({ ...filters, [key]: value });
  return (
    <div className="inventory-filter-fields">
      <div className="inventory-filter-title">
        <strong>Filter inventory</strong>
        <button
          onClick={() =>
            onChange({
              ...filters,
              q: "",
              statuses: [],
              lifecycles: [],
              batch: "",
              channel: "",
              print: "",
              activation: "",
              custody: "",
              from: "",
              to: "",
              risk: "",
            })
          }
        >
          Reset
        </button>
      </div>
      <fieldset>
        <legend>Status</legend>
        {INVENTORY_STATUSES.map((s) => (
          <label className="inventory-check" key={s}>
            <input
              type="checkbox"
              checked={filters.statuses.includes(s)}
              onChange={() =>
                onChange({
                  ...filters,
                  statuses: filters.statuses.includes(s)
                    ? filters.statuses.filter((v) => v !== s)
                    : [...filters.statuses, s],
                })
              }
            />
            <span>{stateLabel(s)}</span>
            <small>
              {facets
                ? (facets.statuses.find((v) => v.value === s)?.count ?? 0)
                : "–"}
            </small>
          </label>
        ))}
      </fieldset>
      <label>
        Lifecycle
        <AdminSelect
          label="Lifecycle"
          value={filters.lifecycles[0] || ""}
          onValueChange={(v) =>
            onChange({ ...filters, lifecycles: v ? [v] : [] })
          }
          options={[
            { value: "", label: "Any lifecycle" },
            ...INVENTORY_STATUSES.map((s) => ({
              value: s,
              label: stateLabel(s),
            })),
          ]}
        />
      </label>
      <label>
        Batch
        <AdminSelect
          label="Batch"
          value={filters.batch}
          onValueChange={(v) => change("batch", v)}
          options={[
            { value: "", label: "All batches" },
            ...(facets?.batches || [])
              .filter((b) => b.id)
              .map((b) => ({
                value: b.id,
                label: b.reference + " · " + b.count,
              })),
          ]}
        />
      </label>
      <label>
        Inventory source
        <AdminSelect
          label="Inventory source"
          value={filters.channel}
          onValueChange={(v) => change("channel", v)}
          options={[
            { value: "", label: "All sources" },
            { value: "OFFLINE_RETAIL", label: "Offline retail" },
            { value: "ONLINE_SYSTEM", label: "Online system" },
          ]}
        />
      </label>
      <label>
        Print evidence
        <AdminSelect
          label="Print evidence"
          value={filters.print}
          onValueChange={(v) => change("print", v)}
          options={[
            { value: "", label: "Any print state" },
            { value: "unrecorded", label: "No recorded printing" },
            { value: "recorded", label: "Printing recorded" },
          ]}
        />
      </label>
      <label>
        Activation
        <AdminSelect
          label="Activation"
          value={filters.activation}
          onValueChange={(v) => change("activation", v)}
          options={[
            { value: "", label: "Any activation state" },
            { value: "inactive", label: "Not activated" },
            { value: "active", label: "Activated" },
          ]}
        />
      </label>
      <label>
        Custody
        <AdminSelect
          label="Custody"
          value={filters.custody}
          onValueChange={(v) => change("custody", v)}
          options={[
            { value: "", label: "Any custodian" },
            { value: "retailer", label: "Retailer" },
            { value: "distributor", label: "Distributor" },
            { value: "unrecorded", label: "Not recorded" },
          ]}
        />
      </label>
      <fieldset>
        <legend>Created (UTC)</legend>
        <label>
          From
          <AdminDatePicker
            label="Created from date"
            value={filters.from}
            onChange={(v) => change("from", v)}
            placeholder="Select start date"
          />
        </label>
        <label>
          To
          <AdminDatePicker
            label="Created to date"
            value={filters.to}
            onChange={(v) => change("to", v)}
            placeholder="Select end date"
          />
        </label>
      </fieldset>
      <label>
        Risk
        <AdminSelect
          label="Risk"
          value={filters.risk}
          onValueChange={(v) => change("risk", v)}
          options={[
            { value: "", label: "All identities" },
            { value: "failed", label: "Failed activation attempts" },
            { value: "blocked", label: "Blocked" },
            { value: "replacement", label: "Replacement linked" },
          ]}
        />
      </label>
    </div>
  );
}
