import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getCustomerOrders } from "@/lib/orders-service";
import { OrdersController } from "@/components/orders/OrdersController";
import { OrdersErrorState } from "@/components/orders/states/OrdersErrorState";

export const metadata: Metadata = {
  title: "Orders & Shipments — VaahanSafe",
  description: "Track physical VaahanSafe QR hardware kits from confirmed purchase to front-door courier delivery.",
};

export default async function OrdersPage() {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    redirect("/login");
  }

  try {
    const data = await getCustomerOrders(auth.user.id);
    return <OrdersController initialData={data} />;
  } catch (err) {
    console.error("[VaahanSafe Orders] Operational error retrieving orders:", err);
    return <OrdersErrorState />;
  }
}
