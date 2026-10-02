"use client";

import { CustomerDataPage } from "@/components/query/CustomerDataPage";
import { ScanHistoryController } from "@/components/scan-history/ScanHistoryController";

export function CustomerPageView() {
  return (
    <CustomerDataPage resource="scan-history">
      {(data) => <ScanHistoryController initialData={data} />}
    </CustomerDataPage>
  );
}
