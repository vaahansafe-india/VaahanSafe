"use client";

import { CustomerDataPage } from "@/components/query/CustomerDataPage";
import { RetailScratchActivation } from "@/components/qr/activate/RetailScratchActivation";

export function CustomerPageView() {
  return (
    <CustomerDataPage resource="qr-activate">
      {(data) => <RetailScratchActivation data={data} />}
    </CustomerDataPage>
  );
}
