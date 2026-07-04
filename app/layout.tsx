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
  themeColor: '#120F2A',
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
      <body className="min-h-screen bg-bg-secondary text-text-primary antialiased font-sans">
        <AppProviders>
          {children}
          <ToastContainer />
        </AppProviders>
      </body>
    </html>
  );
}
