"use server";

import { getAuthenticatedCustomer } from "@/lib/session";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import { executeQrActivation, executeQrReplacement } from "@/lib/qr-service";
import { revalidatePath } from "next/cache";
import { isActivationProofInput } from "@vaahansafe/qr-core/client";
import { z } from "zod";

const secondaryVehicleInput = z.object({
  qrId: z.string().min(1).max(100),
  vehicleId: z.string().min(1).max(100),
  attach: z.boolean(),
});

export async function setSecondaryQrVehicleAction(input: z.infer<typeof secondaryVehicleInput>) {
  const auth = await getAuthenticatedCustomer();
  if (!auth?.phoneVerified) {
    return { success: false, message: "Verify your mobile number to manage QR vehicles." };
  }
  const parsed = secondaryVehicleInput.safeParse(input);
  if (!parsed.success) return { success: false, message: "Select a vehicle and VaahanSafe ID." };
  const { qrId, vehicleId, attach } = parsed.data;
  const { data, error } = await getSupabaseAdminClient().rpc("customer_set_secondary_qr_vehicle", {
    p_session: auth.session.id, p_qr: qrId, p_vehicle: vehicleId, p_attach: attach,
  });
  if (error) {
    console.error("[QR vehicle] Assignment update failed", { code: error.code });
    return { success: false, message: "Couldn't update this VaahanSafe ID. Please try again." };
  }
  switch (data) {
    case "LIMIT_REACHED": return { success: false, message: "This VaahanSafe ID already has two vehicles." };
    case "ALREADY_LINKED": return { success: false, message: "That vehicle already has a VaahanSafe ID." };
    case "REPLACEMENT_PENDING": return { success: false, message: "Complete the QR replacement before adding a vehicle." };
    case "OK":
      revalidatePath("/qr", "layout");
      revalidatePath("/vehicles", "layout");
      revalidatePath("/dashboard");
      return { success: true };
    default: return { success: false, message: "This VaahanSafe ID or vehicle is no longer available." };
  }
}

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
    publicId: string;
  }
): Promise<ActivationActionResult> {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return { success: false, error: "Unauthorized session. Please sign in again." };
  }
  if (!auth.phoneVerified) {
    return { success: false, error: "Verify your mobile number before activating a QR." };
  }

  if (!isActivationProofInput(params?.scratchCode)) {
    return { success: false, error: "Please provide a valid activation secret code." };
  }

  if (typeof params.publicId !== "string" || !params.publicId.trim() || params.publicId.length > 256) {
    return { success: false, error: "Enter the sticker ID printed below the QR." };
  }

  if (typeof params.vehicleId !== "string" || !params.vehicleId || params.vehicleId.length > 100) {
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

  if (!auth.phoneVerified) return { success: false, error: "Verify your mobile number before requesting a replacement." };

  if (!params.stickerId) {
    return { success: false, error: "Please select a sticker to replace." };
  }

  if (!params.reason || params.reason.length > 100 || (params.notes?.length || 0) > 1800) {
    return { success: false, error: "Please provide a reason for the replacement." };
  }

  try {
    const result = await executeQrReplacement(auth.user.id, params, auth.session.id);
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
