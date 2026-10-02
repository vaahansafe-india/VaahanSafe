"use client";

import { CustomerDataPage } from "@/components/query/CustomerDataPage";
import { QrOverviewController } from "@/components/qr/overview/QrOverviewController";

export function CustomerPageView() {
  return (
    <CustomerDataPage resource="qr">
      {(data) => <QrOverviewController overview={data} />}
    </CustomerDataPage>
  );
}
