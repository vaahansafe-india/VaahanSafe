"use client";

import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useCustomerScope } from "./CustomerQueryProvider";
import { CustomerPageLoading, CustomerPageError } from "./CustomerPageState";
import { customerQueryOptions } from "@/lib/customer-queries";
import type {
  CustomerResource,
  CustomerQueryData,
} from "@/lib/customer-query-contract";

/** Each route imports only its own screen. Data caching stays shared by the session. */
export function CustomerDataPage<R extends Exclude<CustomerResource, "shell">>({
  resource,
  children,
}: {
  resource: R;
  children: (
    data: CustomerQueryData[R],
    search: Pick<URLSearchParams, "get">,
  ) => ReactNode;
}) {
  const scope = useCustomerScope();
  const params = useSearchParams();
  const query = useQuery(
    customerQueryOptions(scope, resource, params.toString()),
  );
  if (query.isPending) return <CustomerPageLoading />;
  if (query.isError)
    return (
      <CustomerPageError
        retry={() => {
          void query.refetch();
        }}
      />
    );
  return (
    <div aria-busy={query.isFetching}>
      {query.isFetching && (
        <p role="status" className="mb-3 text-xs text-muted-foreground">
          Refreshing…
        </p>
      )}
      {children(query.data, params)}
    </div>
  );
}
