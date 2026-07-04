'use client';

import React from 'react';
import { formatAmount } from '@/utils/currency';
import { IndianRupee, BarChart2, TrendingUp, Award } from 'lucide-react';

interface SummaryCardProps {
  totalSpent: number;
  averageDailySpend: number;
  expenseCount: number;
  highestExpenseAmount: number;
  largestCategoryName: string;
}

export function SummaryCard({
  totalSpent,
  averageDailySpend,
  expenseCount,
  highestExpenseAmount,
  largestCategoryName,
}: SummaryCardProps) {
  return (
    <div className="bg-black border border-black rounded-2xl p-6 mb-6 shadow-md relative overflow-hidden select-none">
      {/* Decorative subtle gradient reflection */}
      <div className="absolute -right-16 -top-16 w-40 h-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col">
        <span className="text-xs font-bold tracking-wider text-white/50 uppercase">
          Total Spending
        </span>
        <span className="text-4xl md:text-5xl font-black tracking-tight mt-1 text-white">
          {formatAmount(totalSpent)}
        </span>
      </div>

      {/* Grid statistics container */}
      <div className="grid grid-cols-2 gap-3 mt-6 relative z-10">
        {/* Daily Average */}
        <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
          <div className="p-1.5 rounded-lg bg-white/10 text-white mt-0.5">
            <IndianRupee className="h-3.5 w-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-white/50 font-semibold">Daily Avg</span>
            <span className="text-sm font-bold text-white mt-0.5">
              {formatAmount(averageDailySpend)}
            </span>
          </div>
        </div>

        {/* Transactions */}
        <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
          <div className="p-1.5 rounded-lg bg-white/10 text-white mt-0.5">
            <BarChart2 className="h-3.5 w-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-white/50 font-semibold">Logged Items</span>
            <span className="text-sm font-bold text-white mt-0.5">
              {expenseCount} items
            </span>
          </div>
        </div>

        {/* Highest Expense */}
        <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
          <div className="p-1.5 rounded-lg bg-white/10 text-white mt-0.5">
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-white/50 font-semibold">Highest Spend</span>
            <span className="text-sm font-bold text-white mt-0.5 truncate">
              {formatAmount(highestExpenseAmount)}
            </span>
          </div>
        </div>

        {/* Top Category */}
        <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
          <div className="p-1.5 rounded-lg bg-white/10 text-white mt-0.5">
            <Award className="h-3.5 w-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-white/50 font-semibold">Top Category</span>
            <span className="text-sm font-bold text-white mt-0.5 truncate">
              {largestCategoryName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
