"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCustomerScope } from "./CustomerQueryProvider";
import { customerQueryOptions } from "@/lib/customer-queries";
import { CUSTOMER_ROUTES } from "@/lib/customer-query-contract";
import type { ComponentProps } from "react";

export function CustomerLink({
  onMouseEnter,
  onFocus,
  onTouchStart,
  ...props
}: ComponentProps<typeof Link>) {
  const client = useQueryClient();
  const router = useRouter();
  const scope = useCustomerScope();
  function prefetchData() {
    if (typeof props.href !== "string" || !props.href.startsWith("/")) return;
    const url = new URL(props.href, "https://customer.invalid");
    // Warm only the intended destination, rather than downloading every sidebar screen.
    router.prefetch(props.href);
    const resource = CUSTOMER_ROUTES[url.pathname];
    if (resource)
      void client.prefetchQuery(
        customerQueryOptions(scope, resource, url.search),
      );
  }
  return (
    <Link
      {...props}
      prefetch={props.prefetch ?? false}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        prefetchData();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        prefetchData();
      }}
      onTouchStart={(event) => {
        onTouchStart?.(event);
        prefetchData();
      }}
    />
  );
}
