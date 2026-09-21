import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getNotificationCenterData } from "@/lib/notifications-service";
import { NotificationCenterController } from "@/components/notifications/NotificationCenterController";

export const metadata: Metadata = {
  title: "Notifications & Safety Activity — VaahanSafe",
  description: "Official notifications, QR scan alerts, and safety activity updates for your vehicles.",
};

interface NotificationsPageProps {
  searchParams: Promise<{
    view?: string;
    status?: "all" | "unread" | "read";
    category?: string;
    vehicle?: string;
    attention?: "all" | "action_required" | "informational";
    q?: string;
  }>;
}

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    redirect("/login");
  }

  const rawParams = await searchParams;

  const initialData = await getNotificationCenterData(auth.user.id, {
    view: rawParams.view as any,
    status: rawParams.status,
    category: rawParams.category,
    vehicleId: rawParams.vehicle,
    attention: rawParams.attention,
    search: rawParams.q,
  });

  return <NotificationCenterController initialData={initialData} />;
}
