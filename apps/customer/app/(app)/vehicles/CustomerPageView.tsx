"use client";

import { CustomerDataPage } from "@/components/query/CustomerDataPage";
import { VehicleRegistry } from "@/components/vehicles/VehicleRegistry";

export function CustomerPageView() {
  return (
    <CustomerDataPage resource="vehicles">
      {(data) => (
        <VehicleRegistry
          initialItems={data.items}
          totalCount={data.totalCount}
        />
      )}
    </CustomerDataPage>
  );
}
