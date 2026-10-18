"use server";
import { getAuthenticatedCustomer } from "@/lib/session";
import { activateCustomerReplacement } from "@/lib/replacement-service";
import { revalidatePath } from "next/cache";
export async function activateReplacement(id: string, proof: string) {
  const auth = await getAuthenticatedCustomer();
  if (!auth?.phoneVerified)
    return {
      success: false,
      error: "Sign in with your verified mobile account to continue.",
    };
  if (
    typeof id !== "string" ||
    !/^[A-Za-z0-9_-]{1,100}$/.test(id) ||
    typeof proof !== "string" ||
    proof.length > 100
  )
    return {
      success: false,
      error: "Check the request and complete activation code.",
    };
  try {
    const result = await activateCustomerReplacement(
      auth.session.id,
      id,
      proof,
    );
    if (result.success) {
      revalidatePath("/qr");
      revalidatePath("/qr/replace");
      revalidatePath(`/qr/replace/${id}`);
      revalidatePath("/dashboard");
    }
    return result;
  } catch {
    return {
      success: false,
      error:
        "We couldn’t activate this replacement right now. Check its status and try again.",
    };
  }
}
