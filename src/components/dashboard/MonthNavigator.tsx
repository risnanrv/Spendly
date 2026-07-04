'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonthName, getMonthStr } from '@/utils/date';

interface MonthNavigatorProps {
  monthStr: string;
  onChangeMonth: (monthStr: string) => void;
}

export function MonthNavigator({ monthStr, onChangeMonth }: MonthNavigatorProps) {
  const handlePrevMonth = () => {
    const [year, month] = monthStr.split('-').map(Number);
    const prev = new Date(year, month - 2, 1);
    onChangeMonth(getMonthStr(prev));
  };

  const handleNextMonth = () => {
    const [year, month] = monthStr.split('-').map(Number);
    const next = new Date(year, month, 1);
    onChangeMonth(getMonthStr(next));
  };

  return (
    <div className="bg-[#F7F7F7] border border-[#EAEAEA] rounded-xl p-4 mb-4 flex items-center justify-between shadow-sm">
      <button
        onClick={handlePrevMonth}
        className="p-2 text-[#707070] hover:text-[#111111] hover:bg-[#EAEAEA]/50 rounded-lg active:scale-95 transition-all"
        aria-label="Previous Month"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <span className="text-base font-bold text-[#111111] tracking-tight">
        {getMonthName(monthStr)}
      </span>
      <button
        onClick={handleNextMonth}
        className="p-2 text-[#707070] hover:text-[#111111] hover:bg-[#EAEAEA]/50 rounded-lg active:scale-95 transition-all"
        aria-label="Next Month"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
