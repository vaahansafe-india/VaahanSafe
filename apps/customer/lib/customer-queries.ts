import { queryOptions } from "@tanstack/react-query";
import {
  customerQuerySearch,
  type CustomerResource,
  type CustomerQueryData,
} from "./customer-query-contract";

export class CustomerQueryError extends Error {
  constructor(public status: number) {
    super("We couldn't load this information. Please try again.");
  }
}

export function customerQueryOptions<R extends CustomerResource>(
  scope: string,
  resource: R,
  search = "",
) {
  const query = customerQuerySearch(resource, search);
  return queryOptions({
    queryKey: ["customer", scope, resource, query] as const,
    queryFn: async ({ signal }): Promise<CustomerQueryData[R]> => {
      const response = await fetch(
        `/api/customer/data/${resource}${query ? `?${query}` : ""}`,
        {
          credentials: "same-origin",
          cache: "no-store",
          signal: AbortSignal.any([signal, AbortSignal.timeout(20_000)]),
        },
      );
      if (!response.ok) throw new CustomerQueryError(response.status);
      const result = (await response.json()) as {
        scope: string;
        data: CustomerQueryData[R];
      };
      // A different login in another tab must never populate this account's cache.
      if (result.scope !== scope) throw new CustomerQueryError(401);
      return result.data;
    },
    staleTime:
      resource === "orders" ||
      resource === "payments" ||
      resource.startsWith("qr") ||
      resource === "subscription"
        ? 5_000
        : 30_000,
    gcTime: 5 * 60_000,
    retry: (attempt, error) =>
      attempt < 1 && error instanceof CustomerQueryError && error.status >= 500,
  });
}
