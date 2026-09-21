"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@vaahansafe/ui";
import { VaahanIcon } from "@vaahansafe/icons";
import type { VehicleDossierData, VehicleEmergencyContactDetail } from "@/lib/vehicle-types";

interface EmergencyContactSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: VehicleDossierData | null;
  onSuccess?: () => void;
}

export function EmergencyContactSheet({
  open,
  onOpenChange,
  vehicle,
  onSuccess,
}: EmergencyContactSheetProps) {
  const [isAdding, setIsAdding] = React.useState(false);
  const [name, setName] = React.useState("");
  const [relationship, setRelationship] = React.useState("Spouse");
  const [phone, setPhone] = React.useState("");
  const [priority, setPriority] = React.useState(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!vehicle) return null;

  const contacts = vehicle.emergencyContacts || [];

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          relationship: relationship.trim(),
          phone: phone.trim(),
          priority,
          allowCall: true,
          allowMessage: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add emergency contact");
      }

      toast.success("Emergency contact saved.");
      setName("");
      setPhone("");
      setIsAdding(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to save emergency contact");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      const res = await fetch(
        `/api/vehicles/${vehicle.id}/contacts?contactId=${contactId}`,
        { method: "DELETE" }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete contact");
      }

      toast.success("Emergency contact removed.");
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove contact");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-card p-6 border-l border-border">
        <SheetHeader className="border-b border-border pb-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
            GOLDEN HOUR RELAY
          </div>
          <SheetTitle className="font-serif text-2xl font-medium text-foreground">
            Emergency Contacts
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Contacts receiving instant incident notifications and masked caller connections.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Contact List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Configured Contacts ({contacts.length}/5)
              </h4>
              {!isAdding && contacts.length < 5 && (
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="font-mono text-xs font-semibold text-[#cc785c] hover:underline"
                >
                  + Add Contact
                </button>
              )}
            </div>

            {contacts.length === 0 && !isAdding && (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <p className="text-xs text-muted-foreground">
                  No emergency contacts linked to this vehicle.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="mt-3 inline-flex items-center gap-1 font-mono text-xs font-semibold text-[#cc785c]"
                >
                  <span>+ Add First Contact</span>
                </button>
              </div>
            )}

            {contacts.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3.5"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">{c.name}</span>
                    <span className="rounded bg-[#cc785c]/10 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-[#cc785c]">
                      {c.relationship}
                    </span>
                    {c.priority === 1 && (
                      <span className="rounded bg-[#5db8a6]/15 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-[#5db8a6]">
                        PRIMARY
                      </span>
                    )}
                  </div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">
                    {c.phoneMasked}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteContact(c.id)}
                  aria-label={`Remove ${c.name}`}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <VaahanIcon name="close" size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Add Contact Inline Form */}
          {isAdding && (
            <form onSubmit={handleAddContact} className="rounded-2xl border border-border bg-muted/20 p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                  New Emergency Contact
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-foreground/80">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-xs text-foreground focus:border-[#cc785c] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-foreground/80 mb-1">
                    Relationship *
                  </label>
                  <Select
                    value={relationship}
                    onValueChange={(val) => setRelationship(val)}
                  >
                    <SelectTrigger className="h-9 w-full rounded-md border-border bg-background px-2.5 text-xs text-foreground focus:ring-[#cc785c]">
                      <SelectValue placeholder="Relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Spouse">Spouse</SelectItem>
                      <SelectItem value="Parent">Parent</SelectItem>
                      <SelectItem value="Sibling">Sibling</SelectItem>
                      <SelectItem value="Child">Child</SelectItem>
                      <SelectItem value="Friend">Friend</SelectItem>
                      <SelectItem value="Driver">Driver</SelectItem>
                      <SelectItem value="Doctor">Family Doctor</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-foreground/80 mb-1">
                    Priority Level
                  </label>
                  <Select
                    value={String(priority)}
                    onValueChange={(val) => setPriority(Number(val))}
                  >
                    <SelectTrigger className="h-9 w-full rounded-md border-border bg-background px-2.5 text-xs text-foreground focus:ring-[#cc785c]">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 (Primary Responder)</SelectItem>
                      <SelectItem value="2">2 (Secondary)</SelectItem>
                      <SelectItem value="3">3 (Tertiary)</SelectItem>
                      <SelectItem value="4">4 (Backup)</SelectItem>
                      <SelectItem value="5">5 (Emergency Only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-foreground/80">
                  Mobile Number (10 Digits) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 font-mono text-xs text-foreground focus:border-[#cc785c] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAdding(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-[#cc785c] hover:bg-[#a9583e] text-white font-mono text-xs uppercase"
                >
                  {isSubmitting ? "Saving..." : "Add Contact"}
                </Button>
              </div>
            </form>
          )}
        </div>

        <SheetFooter className="mt-8 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
