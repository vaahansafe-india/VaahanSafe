import { redirect } from "next/navigation";
import { getVehicleRepository } from "@vaahansafe/database";
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

  // Load real vehicles for shell context
  let vehicles: Array<{
    id: string;
    registrationNumber: string;
    make: string;
    model: string;
    publicQrId?: string;
  }> = [];

  try {
    const vehicleRepo = getVehicleRepository();
    const userVehicles = await vehicleRepo.findByCustomerId(user.id);
    vehicles = userVehicles.map((v) => ({
      id: v.id,
      registrationNumber: v.registrationNumber,
      make: v.make,
      model: v.model,
    }));
  } catch (err) {
    console.warn("[VaahanSafe] Could not load vehicles for layout shell:", err);
  }

  let unreadNotificationCount = 0;
  try {
    const notifRepo = (await import("@vaahansafe/database")).getNotificationRepository();
    unreadNotificationCount = await notifRepo.countUnreadByUserId(user.id);
  } catch (err) {
    console.warn("[VaahanSafe] Could not load unread notification count for shell:", err);
  }

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
