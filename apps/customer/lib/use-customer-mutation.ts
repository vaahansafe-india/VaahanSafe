"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCustomerScope } from "@/components/query/CustomerQueryProvider";
import type { CustomerResource } from "./customer-query-contract";

/** Server success precedes invalidation; retries never repeat a business mutation. */
export function useCustomerMutation<
  TArgs,
  TResult extends { success: boolean; error?: string; message?: string },
>(action: (args: TArgs) => Promise<TResult>, resources: CustomerResource[]) {
  const client = useQueryClient();
  const scope = useCustomerScope();
  return useMutation({
    mutationFn: async (args: TArgs) => {
      const result = await action(args);
      if (!result.success)
        throw new Error(
          result.message || "We couldn't save this change. Please try again.",
        );
      return result;
    },
    retry: false,
    onSuccess: async () => {
      await Promise.all(
        resources.map((resource) =>
          client.invalidateQueries({ queryKey: ["customer", scope, resource] }),
        ),
      );
    },
  });
}
