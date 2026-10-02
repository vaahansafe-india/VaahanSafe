"use client";

import { CustomerDataPage } from "@/components/query/CustomerDataPage";
import { DashboardController } from "@/components/dashboard/DashboardController";

export function CustomerPageView() {
  return (
    <CustomerDataPage resource="dashboard">
      {(data) => <DashboardController initialData={data} />}
    </CustomerDataPage>
  );
}
