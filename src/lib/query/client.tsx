'use client';
// apps/web/src/lib/query/client.ts
// React Query setup — handles all server state (caching, refetching, loading)
// Every API call goes through React Query hooks, not raw fetch in useEffect

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data stays fresh for 30 seconds before background refetch
        staleTime:            30 * 1000,
        // Cache kept for 5 minutes after component unmounts
        gcTime:               5 * 60 * 1000,
        // Retry failed requests twice with exponential backoff
        retry:                2,
        retryDelay:           (attempt) => Math.min(1000 * 2 ** attempt, 30000),
        // Don't refetch on window focus in development
        refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      },
      mutations: {
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new client
    return makeQueryClient();
  }
  // Browser: reuse existing client
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => makeQueryClient());
  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
}
