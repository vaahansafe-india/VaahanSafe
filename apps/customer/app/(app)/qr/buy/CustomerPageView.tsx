"use client";

import { CustomerDataPage } from "@/components/query/CustomerDataPage";
import { BuyQrExperience } from "@/components/qr/buy/BuyQrExperience";

export function CustomerPageView() {
  return (
    <CustomerDataPage resource="qr-buy">
      {(data) => <BuyQrExperience data={data} />}
    </CustomerDataPage>
  );
}
