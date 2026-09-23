import { redirect } from "next/navigation";
import { getVehicleRepository, getNotificationRepository } from "@vaahansafe/database";
import { getAuthenticatedCustomer } from "../../lib/session";
import { CustomerAppShell } from "../../components/shell/CustomerAppShell";

export default async function AuthenticatedCustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthenticatedCustomer();

  if (!auth) {
    redirect("/login");
  }

  const { user } = auth;

  // Concurrently execute initial layout shell queries
  const [vehiclesResult, notifResult] = await Promise.allSettled([
    getVehicleRepository().findByCustomerId(user.id),
    getNotificationRepository().countUnreadByUserId(user.id),
  ]);

  const vehicles =
    vehiclesResult.status === "fulfilled"
      ? vehiclesResult.value.map((v) => ({
          id: v.id,
          registrationNumber: v.registrationNumber,
          make: v.make,
          model: v.model,
        }))
      : [];

  const unreadNotificationCount =
    notifResult.status === "fulfilled" ? notifResult.value : 0;

  return (
    <CustomerAppShell
      userName={user.name}
      userPhone={user.phone}
      userEmail={user.email}
      phoneVerified={Boolean(user.phone)}
      vehicles={vehicles}
      unreadNotificationCount={unreadNotificationCount}
    >
      {children}
    </CustomerAppShell>
  );
}
