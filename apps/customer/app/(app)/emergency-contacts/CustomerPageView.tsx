"use client";

import { CustomerDataPage } from "@/components/query/CustomerDataPage";
import { EmergencyContactsController } from "@/components/emergency-contacts/EmergencyContactsController";

export function CustomerPageView() {
  return (
    <CustomerDataPage resource="emergency-contacts">
      {(data) => <EmergencyContactsController initialData={data} />}
    </CustomerDataPage>
  );
}
