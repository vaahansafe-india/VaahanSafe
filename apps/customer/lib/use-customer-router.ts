"use client";

import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCustomerScope } from "@/components/query/CustomerQueryProvider";
import { CUSTOMER_ROUTES } from "./customer-query-contract";

export function useCustomerRouter() {
  const router = useRouter();
  const pathname = usePathname();
  const client = useQueryClient();
  const scope = useCustomerScope();
  const refresh = useCallback(() => {
    const invalidation = client.invalidateQueries({
      queryKey: ["customer", scope],
    });
    // Detail pages still render on the server; query-backed pages refresh in place.
    if (!CUSTOMER_ROUTES[pathname]) router.refresh();
    return invalidation;
  }, [client, scope, pathname, router]);
  return { ...router, refresh };
}
