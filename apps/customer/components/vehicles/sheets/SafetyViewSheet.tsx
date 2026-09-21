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
  Switch,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@vaahansafe/ui";
import type { VehicleRegistryItem } from "@/lib/vehicle-types";

interface SafetyViewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: VehicleRegistryItem | null;
  onSuccess?: () => void;
}

export function SafetyViewSheet({
  open,
  onOpenChange,
  vehicle,
  onSuccess,
}: SafetyViewSheetProps) {
  const [showOwnerName, setShowOwnerName] = React.useState(true);
  const [showBloodGroup, setShowBloodGroup] = React.useState(true);
  const [showMedicalNotes, setShowMedicalNotes] = React.useState(false);
  const [showVehicleDetails, setShowVehicleDetails] = React.useState(true);
  const [bloodGroup, setBloodGroup] = React.useState<string>("");
  const [medicalNotes, setMedicalNotes] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (vehicle) {
      setShowOwnerName(vehicle.safety.showOwnerName);
      setShowBloodGroup(vehicle.safety.showBloodGroup);
      setShowMedicalNotes(vehicle.safety.showMedicalNotes);
      setShowVehicleDetails(vehicle.safety.showVehicleDetails);
      setBloodGroup(vehicle.safety.bloodGroup || "");
      setMedicalNotes(vehicle.safety.medicalNotes || "");
    }
  }, [vehicle]);

  if (!vehicle) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/dashboard/safety-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          showOwnerName,
          showBloodGroup,
          showMedicalNotes,
          showVehicleDetails,
          bloodGroup: bloodGroup || null,
          medicalNotes: medicalNotes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update safety view");
      }

      toast.success("Safety view updated.");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "We couldn't update safety view settings. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-card p-6 border-l border-border">
        <SheetHeader className="border-b border-border pb-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
            PUBLIC SAFETY PROJECTION
          </div>
          <SheetTitle className="font-serif text-2xl font-medium text-foreground">
            Emergency Safety View
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Owner-controlled visibility for finders and first responders scanning this vehicle’s QR sticker.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Privacy Protocol Notice */}
          <div className="rounded-xl border border-[#cc785c]/30 bg-[#cc785c]/5 p-3.5 text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Privacy Protection:</span> Owner mobile numbers are strictly masked and never visible to the public or scanner.
          </div>

          {/* Visibility Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between py-1">
              <div>
                <Label htmlFor="toggle-owner-name" className="text-sm font-medium text-foreground">
                  Display Owner Name
                </Label>
                <p className="text-xs text-muted-foreground">
                  Shows your verified name on the emergency scan surface.
                </p>
              </div>
              <Switch
                id="toggle-owner-name"
                checked={showOwnerName}
                onCheckedChange={setShowOwnerName}
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <Label htmlFor="toggle-plate-details" className="text-sm font-medium text-foreground">
                  Display Vehicle Details
                </Label>
                <p className="text-xs text-muted-foreground">
                  Shows vehicle make, model, and registration confirmation.
                </p>
              </div>
              <Switch
                id="toggle-plate-details"
                checked={showVehicleDetails}
                onCheckedChange={setShowVehicleDetails}
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <Label htmlFor="toggle-blood-group" className="text-sm font-medium text-foreground">
                  Emergency Blood Group
                </Label>
                <p className="text-xs text-muted-foreground">
                  Vital Golden Hour medical indicator for emergency responders.
                </p>
              </div>
              <Switch
                id="toggle-blood-group"
                checked={showBloodGroup}
                onCheckedChange={setShowBloodGroup}
              />
            </div>

            {showBloodGroup && (
              <div className="pl-3 border-l-2 border-border mt-2">
                <Label htmlFor="select-blood-group" className="block text-xs font-mono uppercase text-muted-foreground">
                  Selected Blood Group
                </Label>
                <Select
                  value={bloodGroup || "NONE"}
                  onValueChange={(val) => setBloodGroup(val === "NONE" ? "" : val)}
                >
                  <SelectTrigger className="mt-1 h-9 w-full rounded-md border-border bg-background px-3 text-xs text-foreground focus:ring-[#cc785c]">
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Not Specified</SelectItem>
                    <SelectItem value="A+">A+ (A Positive)</SelectItem>
                    <SelectItem value="A-">A- (A Negative)</SelectItem>
                    <SelectItem value="B+">B+ (B Positive)</SelectItem>
                    <SelectItem value="B-">B- (B Negative)</SelectItem>
                    <SelectItem value="AB+">AB+ (AB Positive)</SelectItem>
                    <SelectItem value="AB-">AB- (AB Negative)</SelectItem>
                    <SelectItem value="O+">O+ (O Positive)</SelectItem>
                    <SelectItem value="O-">O- (O Negative)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between py-1">
              <div>
                <Label htmlFor="toggle-medical-notes" className="text-sm font-medium text-foreground">
                  Medical & Allergy Notes
                </Label>
                <p className="text-xs text-muted-foreground">
                  Critical medical instructions (e.g. Diabetic, Penicillin allergy).
                </p>
              </div>
              <Switch
                id="toggle-medical-notes"
                checked={showMedicalNotes}
                onCheckedChange={setShowMedicalNotes}
              />
            </div>

            {showMedicalNotes && (
              <div className="pl-3 border-l-2 border-border mt-2">
                <Label htmlFor="textarea-medical-notes" className="block text-xs font-mono uppercase text-muted-foreground">
                  Emergency Medical Notes
                </Label>
                <textarea
                  id="textarea-medical-notes"
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. Severe peanut allergy, insulin-dependent, carrying EpiPen"
                  className="mt-1 w-full rounded-md border border-border bg-background p-2.5 text-xs text-foreground focus:border-[#cc785c] focus:outline-none"
                />
              </div>
            )}
          </div>

          <SheetFooter className="pt-4 border-t border-border flex sm:justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#cc785c] hover:bg-[#a9583e] text-white font-mono text-xs uppercase tracking-wider"
            >
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
