'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, PiggyBank, FolderOpen, Database } from 'lucide-react';

export function QuickActions() {
  const router = useRouter();

  return (
    <div className="mb-6 flex flex-col">
      <h2 className="text-sm font-bold text-[#111111] uppercase tracking-wider mb-3">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Add Expense */}
        <button
          onClick={() => router.push('/expenses')}
          className="flex items-center gap-3 p-4 bg-white border border-[#EAEAEA] hover:border-black/30 hover:bg-[#F7F7F7] rounded-xl transition-all text-left active:scale-[0.98]"
        >
          <div className="p-2 rounded-lg bg-black/5 text-black">
            <Plus className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#111111] leading-tight">Add Expense</span>
            <span className="text-[10px] text-[#707070] mt-0.5">Log new spend</span>
          </div>
        </button>

        {/* Set Budget */}
        <button
          onClick={() => router.push('/settings')}
          className="flex items-center gap-3 p-4 bg-white border border-[#EAEAEA] hover:border-black/30 hover:bg-[#F7F7F7] rounded-xl transition-all text-left active:scale-[0.98]"
        >
          <div className="p-2 rounded-lg bg-black/5 text-black">
            <PiggyBank className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#111111] leading-tight">Set Budget</span>
            <span className="text-[10px] text-[#707070] mt-0.5">Manage budget limits</span>
          </div>
        </button>

        {/* Manage Categories */}
        <button
          onClick={() => router.push('/settings')}
          className="flex items-center gap-3 p-4 bg-white border border-[#EAEAEA] hover:border-black/30 hover:bg-[#F7F7F7] rounded-xl transition-all text-left active:scale-[0.98]"
        >
          <div className="p-2 rounded-lg bg-black/5 text-black">
            <FolderOpen className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#111111] leading-tight">Categories</span>
            <span className="text-[10px] text-[#707070] mt-0.5">Manage groupings</span>
          </div>
        </button>

        {/* Backups */}
        <button
          onClick={() => router.push('/settings')}
          className="flex items-center gap-3 p-4 bg-white border border-[#EAEAEA] hover:border-black/30 hover:bg-[#F7F7F7] rounded-xl transition-all text-left active:scale-[0.98]"
        >
          <div className="p-2 rounded-lg bg-black/5 text-black">
            <Database className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#111111] leading-tight">Backups</span>
            <span className="text-[10px] text-[#707070] mt-0.5">Export & restore</span>
          </div>
        </button>
      </div>
    </div>
  );
}
