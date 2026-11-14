"use client";

import { setSecondaryQrVehicleAction } from "@/app/(app)/qr/actions";
import { useCustomerMutation } from "./use-customer-mutation";

export function useSecondaryQrVehicleMutation() {
  return useCustomerMutation(setSecondaryQrVehicleAction, [
    "qr-codes", "qr-linkable", "qr", "vehicles", "dashboard", "scan-history", "qr-buy", "qr-activate", "qr-replace",
  ]);
}
