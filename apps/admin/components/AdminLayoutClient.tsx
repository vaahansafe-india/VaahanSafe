"use client";
import { usePathname } from "next/navigation";
import type { AdminIdentity } from "../lib/contracts";
import { AdminShell } from "./AdminShell";
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
  return <AdminShell identity={identity}>{children}</AdminShell>;
}
