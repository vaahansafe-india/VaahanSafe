"use client";

import { CustomerDataPage } from "@/components/query/CustomerDataPage";
import { QrReplacementExperience } from "@/components/qr/replace/QrReplacementExperience";

export function CustomerPageView() {
  return (
    <CustomerDataPage resource="qr-replace">
      {(data, search) => (
        <QrReplacementExperience
          data={data}
          preselectedStickerId={search.get("id") || undefined}
        />
      )}
    </CustomerDataPage>
  );
}
