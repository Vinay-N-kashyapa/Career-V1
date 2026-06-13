'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeQueryClient = makeQueryClient;
exports.getQueryClient = getQueryClient;
exports.QueryProvider = QueryProvider;
// apps/web/src/lib/query/client.ts
// React Query setup — handles all server state (caching, refetching, loading)
// Every API call goes through React Query hooks, not raw fetch in useEffect
const react_query_1 = require("@tanstack/react-query");
const react_1 = require("react");
function makeQueryClient() {
    return new react_query_1.QueryClient({
        defaultOptions: {
            queries: {
                // Data stays fresh for 30 seconds before background refetch
                staleTime: 30 * 1000,
                // Cache kept for 5 minutes after component unmounts
                gcTime: 5 * 60 * 1000,
                // Retry failed requests twice with exponential backoff
                retry: 2,
                retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
                // Don't refetch on window focus in development
                refetchOnWindowFocus: process.env.NODE_ENV === 'production',
            },
            mutations: {
                retry: 1,
            },
        },
    });
}
let browserQueryClient;
function getQueryClient() {
    if (typeof window === 'undefined') {
        // Server: always make a new client
        return makeQueryClient();
    }
    // Browser: reuse existing client
    if (!browserQueryClient)
        browserQueryClient = makeQueryClient();
    return browserQueryClient;
}
function QueryProvider({ children }) {
    const [client] = (0, react_1.useState)(() => makeQueryClient());
    return (<react_query_1.QueryClientProvider client={client}>
      {children}
    </react_query_1.QueryClientProvider>);
}
