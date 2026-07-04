'use client';

import React from 'react';
import { WifiOff, RotateCw } from 'lucide-react';

export default function OfflinePage() {
  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#090514] flex items-center justify-center p-6 text-center select-none">
      <div className="bg-[#120F2A] border border-white/5 rounded-3xl p-8 max-w-sm shadow-2xl space-y-6 flex flex-col items-center">
        {/* Visual Badge Indicator */}
        <div className="w-16 h-16 rounded-full bg-danger/10 text-danger flex items-center justify-center animate-pulse">
          <WifiOff className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-white">Connection Lost</h1>
          <p className="text-xs text-text-secondary leading-relaxed">
            You are currently offline. Spendly requires an active internet connection to access dashboard logs and sync transactions.
          </p>
        </div>

        <button
          onClick={handleReload}
          className="px-5 py-2.5 bg-brand hover:bg-brand-dark rounded-xl font-bold text-xs text-white flex items-center gap-2 shadow-lg shadow-brand/20 active:scale-[0.98] transition-all"
        >
          <RotateCw className="h-3.5 w-3.5" />
          Retry Connection
        </button>
      </div>
    </div>
  );
}
