"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedCustomer } from "./session";
import { getSupabaseAdminClient } from "@vaahansafe/database";

export interface ActionResult {
  success: boolean;
  message: string;
  error?: string;
}

/** Persist an owned-account preference and its audit event in one transaction. */
export async function toggleAutoRenewalAction(
  subscriptionId: string,
  cancelAtEnd: boolean,
): Promise<ActionResult> {
  const auth = await getAuthenticatedCustomer();
  if (!auth)
    return {
      success: false,
      message: "Please sign in to continue.",
      error: "UNAUTHORIZED",
    };
  if (!auth.phoneVerified)
    return {
      success: false,
      message: "Verify your mobile number to continue.",
      error: "PHONE_REQUIRED",
    };
  if (
    typeof subscriptionId !== "string" ||
    !subscriptionId ||
    subscriptionId.length > 128 ||
    typeof cancelAtEnd !== "boolean"
  ) {
    return {
      success: false,
      message: "Please choose a valid subscription.",
      error: "INVALID_REQUEST",
    };
  }
  try {
    const { data, error } = await getSupabaseAdminClient().rpc(
      "set_subscription_auto_renew",
      {
        p_user: auth.user.id,
        p_subscription: subscriptionId,
        p_cancel: cancelAtEnd,
      },
    );
    if (error) throw new Error("Subscription preference unavailable");
    if (data !== true) {
      return {
        success: false,
        message:
          "This subscription cannot change its renewal preference. Contact support for billing help.",
        error: "RENEWAL_UNAVAILABLE",
      };
    }
    revalidatePath("/subscription");
    return {
      success: true,
      message:
        "Renewal preference saved. Your current paid coverage remains available until its term ends.",
    };
  } catch {
    console.error(
      "[SubscriptionActions] Renewal preference update unavailable",
    );
    return {
      success: false,
      message:
        "We couldn't update your renewal preference right now. Please try again.",
      error: "INTERNAL_ERROR",
    };
  }
}
