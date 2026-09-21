"use server";

import { getAuthenticatedCustomer } from "@/lib/session";
import { executeQrActivation, executeQrReplacement } from "@/lib/qr-service";
import { revalidatePath } from "next/cache";

export interface ActivationActionResult {
  success: boolean;
  error?: string;
  publicId?: string;
  maskedPlate?: string;
}

export async function submitQrActivationAction(
  params: {
    scratchCode: string;
    vehicleId: string;
    publicId?: string;
  }
): Promise<ActivationActionResult> {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return { success: false, error: "Unauthorized session. Please sign in again." };
  }

  if (!params.scratchCode || params.scratchCode.trim().length < 6) {
    return { success: false, error: "Please provide a valid activation secret code." };
  }

  if (!params.vehicleId) {
    return { success: false, error: "Please select a vehicle to link this QR sticker to." };
  }

  try {
    const result = await executeQrActivation(auth.user.id, params);
    if (result.success) {
      revalidatePath("/qr");
      revalidatePath("/dashboard");
      revalidatePath("/vehicles");
    }
    return result;
  } catch (err) {
    console.error("[VaahanSafe] Error activating retail QR:", err);
    return {
      success: false,
      error: "We could not complete sticker activation right now. Please try again.",
    };
  }
}

export interface ReplacementActionResult {
  success: boolean;
  error?: string;
  requestId?: string;
}

export async function submitQrReplacementAction(
  params: {
    stickerId: string;
    reason: string;
    notes?: string;
  }
): Promise<ReplacementActionResult> {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return { success: false, error: "Unauthorized session. Please sign in again." };
  }

  if (!params.stickerId) {
    return { success: false, error: "Please select a sticker to replace." };
  }

  if (!params.reason) {
    return { success: false, error: "Please provide a reason for the replacement." };
  }

  try {
    const result = await executeQrReplacement(auth.user.id, params);
    if (result.success) {
      revalidatePath("/qr");
      revalidatePath("/qr/replace");
      revalidatePath("/dashboard");
    }
    return result;
  } catch (err) {
    console.error("[VaahanSafe] Error submitting QR replacement:", err);
    return {
      success: false,
      error: "We could not submit replacement request right now. Please try again.",
    };
  }
}
