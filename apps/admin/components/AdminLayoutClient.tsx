"use client";
import { usePathname } from "next/navigation";
import type { AdminIdentity } from "../lib/contracts";
import { AdminShell } from "./AdminShell";
import { AdminQueryProvider } from "./AdminQueryProvider";
import { AdminRouteProgressProvider } from "./loading";
export function AdminLayoutClient({
  identity,
  children,
}: {
  identity: AdminIdentity | null;
  children: React.ReactNode;
}) {
  const path = usePathname();
  if (
    !identity ||
    !identity.emailVerified ||
    path === "/login" ||
    path === "/verify-phone" ||
    path === "/verify-email"
  )
    return <>{children}</>;
  return (
    <AdminQueryProvider key={`${identity.id}:${identity.sessionId}`}>
      <AdminRouteProgressProvider>
        <AdminShell identity={identity}>{children}</AdminShell>
      </AdminRouteProgressProvider>
    </AdminQueryProvider>
  );
}
