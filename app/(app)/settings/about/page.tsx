'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';

export default function AboutSettingsPage() {
  return (
    <div className="max-w-md mx-auto space-y-6 select-none">
      {/* Back Header */}
      <div className="flex items-center gap-2">
        <Link href="/settings" className="p-2 -ml-2 text-[#707070] hover:text-[#111111] transition-all">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-[#111111]">About Spendly</h1>
      </div>

      <div className="bg-white border border-[#EAEAEA] rounded-2xl p-6 shadow-sm flex flex-col items-center text-center space-y-4">
        {/* App Logo */}
        <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center shadow-md">
          <span className="text-3xl font-black tracking-tighter text-white">S</span>
        </div>
        
        <div>
          <h2 className="text-lg font-bold text-[#111111]">Spendly</h2>
          <span className="text-xs text-[#707070]">v2.0.0 (MVP Production)</span>
        </div>

        <p className="text-xs text-[#707070] leading-relaxed">
          Spendly is a minimal personal finance application built to deliver an Apple Wallet-style experience. Tracks local expenses, configures monthly targets, and safeguards data using SQLite multi-user tenant sandboxing.
        </p>

        {/* Feature list */}
        <div className="w-full text-left space-y-3 pt-4 border-t border-[#EAEAEA]">
          <div className="flex items-start gap-2 text-xs text-[#707070]">
            <CheckCircle2 className="h-4.5 w-4.5 text-black shrink-0" />
            <div>
              <span className="font-bold text-[#111111]">Multi-User Tenant Isolation</span>
              <p className="mt-0.5">Database partitions ensure your personal financial history is never visible to others.</p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-xs text-[#707070]">
            <CheckCircle2 className="h-4.5 w-4.5 text-black shrink-0" />
            <div>
              <span className="font-bold text-[#111111]">PWA Ready</span>
              <p className="mt-0.5">Add to Home Screen capability enables smooth offline-ready utility on mobile devices.</p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-xs text-[#707070]">
            <CheckCircle2 className="h-4.5 w-4.5 text-black shrink-0" />
            <div>
              <span className="font-bold text-[#111111]">100% Offline-Capable Storage</span>
              <p className="mt-0.5">Local backups and statements guarantee complete ownership over financial data.</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="w-full pt-4 border-t border-[#EAEAEA] text-[10px] text-[#A0A0A0] text-center">
          Developed under Google DeepMind Advanced Agentic Coding. All rights reserved.
        </div>
      </div>
    </div>
  );
}
