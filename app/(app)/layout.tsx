'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { authClient } from '@/lib/auth-client';
import { User } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  return (
    <div className="min-h-screen bg-white text-[#111111] flex">
      {/* Sidebar for Desktop */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 pb-20 lg:pb-0">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white/80 backdrop-blur-md border-b border-[#EAEAEA] flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center shadow-sm">
              <span className="text-sm font-black tracking-tighter text-white">S</span>
            </div>
            <span className="font-extrabold tracking-tight text-base text-[#111111]">Spendly</span>
          </div>

          <div>
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="w-8 h-8 rounded-full border border-[#EAEAEA] object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#F7F7F7] border border-[#EAEAEA] flex items-center justify-center text-black font-bold text-xs">
                {user?.name ? user.name[0].toUpperCase() : <User className="h-3.5 w-3.5" />}
              </div>
            )}
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pt-20 lg:pt-8 w-full max-w-7xl mx-auto overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
