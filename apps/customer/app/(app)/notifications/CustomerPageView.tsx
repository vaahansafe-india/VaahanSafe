"use client";

import { CustomerDataPage } from "@/components/query/CustomerDataPage";
import { NotificationCenterController } from "@/components/notifications/NotificationCenterController";

export function CustomerPageView() {
  return (
    <CustomerDataPage resource="notifications">
      {(data) => <NotificationCenterController initialData={data} />}
    </CustomerDataPage>
  );
}
