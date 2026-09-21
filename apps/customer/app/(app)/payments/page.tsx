import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getCustomerPayments } from "@/lib/payments-service";
import { PaymentsController } from "@/components/payments/PaymentsController";
import { PaymentsErrorState } from "@/components/payments/states/PaymentsErrorState";

export const metadata: Metadata = {
  title: "Payments & Invoices — VaahanSafe",
  description: "Review authoritative payments connected to your VaahanSafe vehicle safety orders and services.",
};

export default async function PaymentsPage() {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    redirect("/login?returnUrl=%2Fpayments");
  }

  try {
    const data = await getCustomerPayments(auth.user.id);
    return <PaymentsController initialData={data} />;
  } catch (err) {
    console.error("[VaahanSafe Payments Page] Operational query error:", err);
    return <PaymentsErrorState />;
  }
}
