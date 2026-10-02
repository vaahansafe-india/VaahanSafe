"use client";

import { useQuery } from "@tanstack/react-query";
import { CustomerAppShell } from "@/components/shell/CustomerAppShell";
import { useCustomerScope } from "./CustomerQueryProvider";
import { customerQueryOptions } from "@/lib/customer-queries";
import type { ReactNode } from "react";

export function CustomerQueryShell({
  children,
  ...props
}: {
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  phoneVerified: boolean;
  googleVerified: boolean;
  children: ReactNode;
}) {
  const scope = useCustomerScope();
  const query = useQuery(customerQueryOptions(scope, "shell"));
  return (
    <CustomerAppShell
      {...props}
      vehicles={query.data?.vehicles}
      unreadNotificationCount={query.data?.unreadNotificationCount}
      shellPending={query.isPending}
      serviceUnavailable={query.isError}
    >
      {children}
    </CustomerAppShell>
  );
}
