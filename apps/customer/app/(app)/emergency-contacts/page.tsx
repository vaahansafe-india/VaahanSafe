import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getSafetyContactNetwork } from "@/lib/contacts-service";
import { EmergencyContactsController } from "@/components/emergency-contacts/EmergencyContactsController";
import { ContactsErrorState } from "@/components/emergency-contacts/states/ContactsErrorState";

export const metadata: Metadata = {
  title: "Safety Contact Network — VaahanSafe",
  description:
    "Manage the trusted contacts you choose to associate with your VaahanSafe vehicle safety identity.",
};

export const dynamic = "force-dynamic";

export default async function EmergencyContactsPage() {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    redirect("/login?returnUrl=%2Femergency-contacts");
  }

  try {
    const networkData = await getSafetyContactNetwork(auth.user.id);
    return <EmergencyContactsController initialData={networkData} />;
  } catch (err) {
    console.error("[EmergencyContactsPage] Error loading safety contacts:", err);
    return <ContactsErrorState />;
  }
}
