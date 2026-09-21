import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getSettingsData } from "@/lib/settings-service";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { SettingsSkeleton } from "@/components/settings/states/SettingsSkeleton";

export const metadata: Metadata = {
  title: "Profile Settings — VaahanSafe",
  description: "Personal and owner contact information for your VaahanSafe account.",
};

export default async function ProfileSettingsPage() {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    redirect("/login");
  }

  const initialData = await getSettingsData(auth.user.id, auth.session.id);

  return (
    <div className="space-y-6">
      <div className="pb-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
          VaahanSafe &bull; Account & Control Center
        </div>
        <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Calm, privacy-first management of your identity, vehicle projections, and security sessions.
        </p>
      </div>

      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsShell initialData={initialData} defaultCategory="profile" />
      </Suspense>
    </div>
  );
}
