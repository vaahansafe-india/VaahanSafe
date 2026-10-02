"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { CustomerQueryError } from "@/lib/customer-queries";

const CustomerScope = createContext<string | null>(null);

export function CustomerQueryProvider({
  scope,
  children,
}: {
  scope: string;
  children: ReactNode;
}) {
  // This provider is keyed by the server-validated session and unmounts at sign-out.
  // Cache lives only in memory; no browser persistence or global server cache.
  const [client] = useState(() => {
    const queryClient = new QueryClient({
      queryCache: new QueryCache({
        onError: (error) => {
          if (
            error instanceof CustomerQueryError &&
            error.status === 401 &&
            typeof window !== "undefined"
          ) {
            void queryClient.cancelQueries();
            queryClient.clear();
            window.location.replace("/login");
          }
        },
      }),
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          gcTime: 5 * 60_000,
          refetchOnWindowFocus: true,
          retry: false,
        },
      },
    });
    return queryClient;
  });
  return (
    <CustomerScope.Provider value={scope}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </CustomerScope.Provider>
  );
}

export function useCustomerScope() {
  const scope = useContext(CustomerScope);
  if (!scope)
    throw new Error("Customer queries require an authenticated scope");
  return scope;
}
