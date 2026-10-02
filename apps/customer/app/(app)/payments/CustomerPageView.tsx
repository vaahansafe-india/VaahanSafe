"use client";

import { CustomerDataPage } from "@/components/query/CustomerDataPage";
import { PaymentsController } from "@/components/payments/PaymentsController";

export function CustomerPageView() {
  return (
    <CustomerDataPage resource="payments">
      {(data) => <PaymentsController initialData={data} />}
    </CustomerDataPage>
  );
}
