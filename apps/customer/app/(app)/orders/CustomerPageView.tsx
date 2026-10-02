"use client";

import { CustomerDataPage } from "@/components/query/CustomerDataPage";
import { OrdersController } from "@/components/orders/OrdersController";

export function CustomerPageView() {
  return (
    <CustomerDataPage resource="orders">
      {(data) => <OrdersController initialData={data} />}
    </CustomerDataPage>
  );
}
