'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Logo } from '@/components/ui/Logo';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const [showLoader, setShowLoader] = useState(false);

  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register');

  useEffect(() => {
    if (isPending) {
      const timer = setTimeout(() => {
        setShowLoader(true);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setShowLoader(false);
    }
  }, [isPending]);

  useEffect(() => {
    if (!isPending) {
      if (!session && !isAuthPage) {
        router.replace('/login');
      } else if (session && isAuthPage) {
        router.replace('/expenses');
      }
    }
  }, [session, isPending, isAuthPage, router]);

  if (isPending) {
    if (!showLoader) {
      return <div className="fixed inset-0 bg-[#F5F5F5]" />;
    }
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#F5F5F5] text-black transition-opacity duration-300 animate-in fade-in">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <Logo className="w-14 h-14" />
        </div>
      </div>
    );
  }

  // Render children only if we match the required auth state
  if (!session && !isAuthPage) {
    return <div className="fixed inset-0 bg-[#F5F5F5]" />;
  }
  if (session && isAuthPage) {
    return <div className="fixed inset-0 bg-[#F5F5F5]" />;
  }

  return <>{children}</>;
}
