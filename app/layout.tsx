if (typeof window === 'undefined') {
  const React = require('react');
  if (!React.useSyncExternalStore) {
    React.useSyncExternalStore = (subscribe: any, getSnapshot: any, getServerSnapshot: any) => {
      return getServerSnapshot ? getServerSnapshot() : getSnapshot();
    };
  }
}

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProviders } from '@/providers/AppProviders';
import { ToastContainer } from '@/components/ui/ToastContainer';

export const metadata: Metadata = {
  title: 'Spendly',
  description: 'Smart Expense & Budget Tracker',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Spendly',
  },
  icons: {
    icon: '/favicon.png',
    apple: '/icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F5F5F5] text-[#0A0A0A] antialiased font-sans">
        <AppProviders>
          {children}
          <ToastContainer />
        </AppProviders>
      </body>
    </html>
  );
}


