'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamic import of the PWA authenticated app shell with SSR disabled.
// This prevents server-side evaluation of Firebase and React Query cache observers
// during Next.js static prerendering, eliminating useSyncExternalStore crashes.
const AppLayoutClient = dynamic(
  () => import('./layout-client').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center font-sans select-none">
        <span className="w-6 h-6 rounded-full border-2 border-neutral-300 border-t-neutral-800 animate-spin" />
      </div>
    ),
  }
);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppLayoutClient>{children}</AppLayoutClient>;
}
