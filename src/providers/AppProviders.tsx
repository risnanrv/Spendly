'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { FirebaseSyncProvider } from './FirebaseSyncProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: false,
          },
        },
      })
  );

  useEffect(() => {
    // Ensure document is permanently locked in light theme mode
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <FirebaseSyncProvider>
        <AuthGuard>{children}</AuthGuard>
      </FirebaseSyncProvider>
    </QueryClientProvider>
  );
}
