"use client";

import { CustomerDataPage } from "@/components/query/CustomerDataPage";
import { QrRegistryExperience } from "@/components/qr/registry/QrRegistryExperience";

export function CustomerPageView() {
  return (
    <CustomerDataPage resource="qr-codes">
      {(data) => <QrRegistryExperience initialItems={data.items} />}
    </CustomerDataPage>
  );
}
