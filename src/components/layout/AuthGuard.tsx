'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register');

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
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white text-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center shadow-sm">
            <span className="text-3xl font-extrabold tracking-tighter text-white">S</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight mt-2 text-[#111111]">Spendly</h1>
          <p className="text-sm text-[#707070]">Loading workspace...</p>
        </div>
        <div className="absolute bottom-12">
          <Loader2 className="h-6 w-6 animate-spin text-black" />
        </div>
      </div>
    );
  }

  // Render children only if we match the required auth state
  if (!session && !isAuthPage) {
    return null;
  }
  if (session && isAuthPage) {
    return null;
  }

  return <>{children}</>;
}
