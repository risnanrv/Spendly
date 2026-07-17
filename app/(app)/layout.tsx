'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { Logo } from '@/components/ui/Logo';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-[#111111] flex">
      {/* Sidebar for Desktop */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 pb-20 lg:pb-0">
        {/* Mobile Header (Centered Logo Only) */}
        <header className="lg:hidden h-16 bg-white/90 backdrop-blur-md border-b border-[#EAEAEA] flex items-center justify-center fixed top-0 left-0 right-0 z-20">
          <Logo className="w-7 h-7" />
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
