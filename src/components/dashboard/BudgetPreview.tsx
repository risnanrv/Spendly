'use client';

import React from 'react';
import { formatAmount } from '@/utils/currency';

interface BudgetPreviewProps {
  hasBudget: boolean;
  budgetAmount: number;
  spent: number;
  remaining: number;
  progress: number; // 0 to 1
  status: 'safe' | 'approaching' | 'exceeded' | 'none';
  remainingDays: number;
  monthName: string;
}

export function BudgetPreview({
  hasBudget,
  budgetAmount,
  spent,
  remaining,
  progress,
  status,
  remainingDays,
  monthName,
}: BudgetPreviewProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'exceeded':
        return {
          bg: 'bg-red-50 text-red-500 border-red-100',
          fill: 'bg-red-500',
        };
      case 'approaching':
        return {
          bg: 'bg-amber-50 text-amber-600 border-amber-100',
          fill: 'bg-amber-500',
        };
      default:
        return {
          bg: 'bg-[#F7F7F7] text-black border-[#EAEAEA]',
          fill: 'bg-black',
        };
    }
  };

  const colors = getStatusColor();

  return (
    <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-[#111111] uppercase tracking-wider">
          Monthly Budget
        </h2>
        {hasBudget && (
          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${colors.bg}`}>
            {status}
          </span>
        )}
      </div>

      {hasBudget ? (
        <div className="flex flex-col">
          <div className="flex justify-between items-baseline mb-2">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-[#111111]">
                {formatAmount(spent)}
              </span>
              <span className="text-xs text-[#707070]">
                spent of {formatAmount(budgetAmount)}
              </span>
            </div>
            <span className="text-xs text-[#707070] font-semibold">
              {remainingDays} days left
            </span>
          </div>

          {/* Progress bar line */}
          <div className="w-full h-2 bg-[#F7F7F7] border border-[#EAEAEA] rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${colors.fill}`}
              style={{ width: `${Math.min(100, progress * 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-[#707070]">
            <span>Remaining</span>
            <span className="font-bold text-[#111111]">{formatAmount(remaining)}</span>
          </div>
        </div>
      ) : (
        <div className="py-6 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-[#707070]">
            No monthly budget configured for {monthName}.
          </p>
          <p className="text-xs text-[#A0A0A0] mt-1">
            Set budget limits to track spending thresholds.
          </p>
        </div>
      )}
    </div>
  );
}
