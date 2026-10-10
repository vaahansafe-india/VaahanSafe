import { queryOptions } from "@tanstack/react-query";
import { CustomerQueryError } from "../../lib/customer-queries";
import { canonicalSearch } from "./filters";
import type { Envelope, Filters, Section } from "./types";
export function analyticsOptions<S extends Section>(
  scope: string,
  section: S,
  filters: Filters,
) {
  const search = canonicalSearch(section, filters);
  return queryOptions({
    queryKey: ["customer-analytics", scope, section, search] as const,
    queryFn: ({ signal }) => fetchAnalytics(scope, section, search, signal),
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === scope ? previousData : undefined,
    staleTime: 60000,
    gcTime: 5 * 60000,
    retry: false,
  });
}
export async function fetchAnalytics<S extends Section>(
  scope: string,
  section: S,
  search: string,
  signal: AbortSignal,
): Promise<Envelope<S>> {
  const response = await fetch(`/api/analytics/${section}?${search}`, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) throw new CustomerQueryError(response.status);
  const result = (await response.json()) as Envelope<S>;
  if (result.scope !== scope) throw new CustomerQueryError(401);
  return result;
}
