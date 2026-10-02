"use client";

import { CustomerDataPage } from "@/components/query/CustomerDataPage";
import { SubscriptionController } from "@/components/subscription/SubscriptionController";

export function CustomerPageView() {
  return (
    <CustomerDataPage resource="subscription">
      {(data) => <SubscriptionController initialData={data} />}
    </CustomerDataPage>
  );
}
