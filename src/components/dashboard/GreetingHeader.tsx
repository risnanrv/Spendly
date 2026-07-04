'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';

interface GreetingHeaderProps {
  todayDateStr: string;
  greeting: string;
  userName: string;
}

export function GreetingHeader({
  todayDateStr,
  greeting,
  userName,
}: GreetingHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex flex-col">
        <span className="text-xs font-bold uppercase tracking-wider text-[#707070]">
          {todayDateStr}
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#111111] mt-1">
          {greeting}, {userName}
        </h1>
      </div>
      <button
        onClick={() => router.push('/settings')}
        className="w-10 h-10 rounded-full border border-[#EAEAEA] bg-[#F7F7F7] flex items-center justify-center text-[#707070] hover:text-[#111111] hover:bg-[#EAEAEA]/50 transition-all active:scale-95"
        aria-label="Settings Page"
      >
        <Settings className="h-5 w-5" />
      </button>
    </div>
  );
}
