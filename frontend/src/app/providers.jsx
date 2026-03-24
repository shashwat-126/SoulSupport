"use client";

import { QueryClient, QueryClientProvider, HydrationBoundary } from '@tanstack/react-query';
import { useState } from 'react';
import { useSessionRealtime } from '@/hooks/useSessionRealtime';

function RealtimeSessionBridge({ queryClient }) {
  useSessionRealtime({
    onSessionUpdate: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
  });

  return null;
}

export function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeSessionBridge queryClient={queryClient} />
      <HydrationBoundary>{children}</HydrationBoundary>
    </QueryClientProvider>
  );
}
