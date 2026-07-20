'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { Logo } from '@/components/ui/Logo';
import { authClient } from '@/lib/auth-client';
import { User } from 'lucide-react';
import Link from 'next/link';

export default function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#0A0A0A] flex font-sans">
      {/* Sidebar for Desktop */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-16 pb-20 lg:pb-0">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white/70 backdrop-blur-xl border-b border-[#E8E8E8] flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-30">
          <div className="w-8" />
          <Logo className="w-8 h-8" withText textSize="text-md" />
          
          <Link href="/settings">
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="w-7 h-7 rounded-full border border-[#E8E8E8] object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center font-semibold text-xs">
                {user?.name ? user.name[0].toUpperCase() : <User className="h-3.5 w-3.5" />}
              </div>
            )}
          </Link>
        </header>

        {/* Content Container */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pt-20 lg:pt-8 w-full max-w-5xl mx-auto overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
