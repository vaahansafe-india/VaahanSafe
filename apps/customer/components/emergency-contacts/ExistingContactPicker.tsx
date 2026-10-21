"use client";

import { useEffect, useId, useState } from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type { ReusableSafetyContact } from "@/lib/contacts-types";
import { getReusableContactsAction } from "@/lib/reusable-contacts-actions";

export function ExistingContactPicker({
  active,
  targetVehicleIds,
  onSelect,
}: {
  active: boolean;
  targetVehicleIds: string[];
  onSelect: (contact: ReusableSafetyContact) => void;
}) {
  const id = useId();
  const [contacts, setContacts] = useState<ReusableSafetyContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState("");
  useEffect(() => {
    if (!active) {
      setContacts([]);
      setSelected("");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    getReusableContactsAction()
      .then((result) => {
        if (cancelled) return;
        if (result.error) setError(result.error);
        else setContacts(result.contacts || []);
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "Saved contacts could not load. Retry or add a new contact below.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active, retry]);
  if (!active) return null;
  const alreadyLinked = (contact: ReusableSafetyContact) =>
    targetVehicleIds.length > 0 &&
    targetVehicleIds.every((vehicleId) =>
      contact.linkedVehicleIds.includes(vehicleId),
    );
  return (
    <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
      <div className="flex items-start gap-2.5">
        <VaahanIcon
          name="users"
          size={20}
          className="mt-0.5 shrink-0 text-primary"
        />
        <div className="min-w-0">
          <label htmlFor={id} className="text-sm font-semibold">
            Choose from existing contacts
          </label>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Use a contact from another vehicle in your account. Review their
            details and permissions for this vehicle before saving.
          </p>
        </div>
      </div>
      {error ? (
        <div role="alert" className="text-xs leading-relaxed">
          <p>{error}</p>
          <button
            type="button"
            className="min-h-11 font-semibold text-primary underline"
            onClick={() => setRetry((value) => value + 1)}
          >
            Retry saved contacts
          </button>
        </div>
      ) : loading ? (
        <p role="status" className="text-xs text-muted-foreground">
          Loading your saved contacts…
        </p>
      ) : contacts.length ? (
        <select
          id={id}
          value={selected}
          className="min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm"
          onChange={(event) => {
            const contact = contacts.find(
              (item) => item.id === event.target.value,
            );
            if (contact && !alreadyLinked(contact)) {
              setSelected(contact.id);
              onSelect(contact);
            }
          }}
        >
          <option value="" disabled>
            Select a saved contact
          </option>
          {contacts.map((contact) => (
            <option
              key={contact.id}
              value={contact.id}
              disabled={alreadyLinked(contact)}
            >
              {contact.name} · {contact.maskedPhone} ·{" "}
              {contact.sourceVehicleLabel}
              {alreadyLinked(contact) ? " · Already linked" : ""}
            </option>
          ))}
        </select>
      ) : (
        <p
          role="status"
          className="text-xs leading-relaxed text-muted-foreground"
        >
          No saved contacts yet. Enter a new contact below; you can reuse it for
          your other vehicles later.
        </p>
      )}
      {selected && (
        <p role="status" className="text-xs leading-relaxed text-primary">
          Contact details filled in. Changes here apply to the new vehicle only.
        </p>
      )}
    </div>
  );
}
