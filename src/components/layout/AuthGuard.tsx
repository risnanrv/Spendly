'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

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
          <Logo className="w-16 h-16" />
          <h1 className="text-xl font-bold tracking-tight text-[#111111]">Spendly</h1>
          <p className="text-xs text-[#707070] mt-1">Loading workspace...</p>
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
