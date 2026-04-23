"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { configureAuthBridge } from "@/lib/api/client";
import { useAuthStore } from "@/store/authStore";
import { OrgBootstrap } from "@/components/org-bootstrap";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, err) => {
          const status =
            (err as { status?: number } | undefined)?.status ?? 0;
          if (status === 401 || status === 403 || status === 404) return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: { retry: 0 },
    },
  });
}

let browserClient: QueryClient | undefined;
function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient();
  if (!browserClient) browserClient = makeQueryClient();
  return browserClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  React.useEffect(() => {
    configureAuthBridge({
      getTokens: () => {
        const { accessToken, refreshToken } = useAuthStore.getState();
        return { accessToken, refreshToken };
      },
      setAccessToken: (token) => {
        useAuthStore.getState().setAccessToken(token);
      },
      onUnauthorized: () => {
        useAuthStore.getState().logout();
      },
    });
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <OrgBootstrap />
        {children}
        <Toaster />
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
