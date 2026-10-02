"use client";

import { CustomerDataPage } from "@/components/query/CustomerDataPage";
import { SettingsShell } from "@/components/settings/SettingsShell";
import type { SettingsCategory } from "@/lib/settings-types";

export function CustomerPageView() {
  return (
    <CustomerDataPage resource="settings">
      {(data, search) => (
        <>
          <div className="mb-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
              VaahanSafe · Account &amp; Control Center
            </p>
            <h1 className="mt-1 font-serif text-4xl">Settings</h1>
          </div>
          <SettingsShell
            initialData={data}
            defaultCategory={
              (search.get("category") as SettingsCategory) || "profile"
            }
          />
        </>
      )}
    </CustomerDataPage>
  );
}
