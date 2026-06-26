"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { useState, type ReactNode } from "react";

import { ThemeProvider } from "@/components/theme/theme-provider";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: 1000 * 60 * 20,
            retry: (failureCount, error) => {
              if (error instanceof Error && /unauthorized|forbidden|validation/i.test(error.message)) return false;
              return failureCount < 2;
            },
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8_000),
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 4,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
