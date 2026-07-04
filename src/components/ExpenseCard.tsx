'use client';

import React from 'react';
import { formatAmount } from '@/utils/currency';
import { getCategoryColorClasses } from '@/utils/colors';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { useCategories } from '@/hooks/useCategories';

interface ExpenseCardProps {
  id?: string;
  title: string;
  note: string | null;
  amount: number; // Integer cents
  categoryId: string;
  date: Date | string;
  onClick?: () => void;
  loading?: boolean;
}

export function ExpenseCard({
  title,
  note,
  amount,
  categoryId,
  date,
  onClick,
  loading = false,
}: ExpenseCardProps) {
  const { data: categories } = useCategories();

  if (loading) {
    return (
      <div className="bg-[#F7F7F7] border border-[#EAEAEA] rounded-xl p-4 animate-pulse flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#EAEAEA]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[#EAEAEA] rounded w-3/5" />
          <div className="h-3 bg-[#EAEAEA] rounded w-2/5" />
        </div>
        <div className="h-5 bg-[#EAEAEA] rounded w-1/5" />
      </div>
    );
  }

  // Find category details
  const category = (categories || []).find((c: any) => c.id === categoryId);
  const categoryColor = category?.color || 'slate';
  const categoryName = category?.name || 'Category';
  const categoryIcon = category?.icon || 'grid';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

  const colorSet = getCategoryColorClasses(categoryColor);

  // Title fallback if empty or default 'Untitled'
  const trimmedTitle = (title || '').trim();
  const displayTitle = (trimmedTitle === '' || trimmedTitle.toLowerCase() === 'untitled') ? categoryName : trimmedTitle;

  return (
    <div
      onClick={onClick}
      className={`bg-[#F7F7F7] border border-[#EAEAEA] hover:border-[#A0A0A0] hover:bg-[#EAEAEA]/30 rounded-xl p-4 flex items-center justify-between shadow-sm transition-all ${
        onClick ? 'cursor-pointer active:scale-[0.99]' : ''
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Category Circle */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 ${colorSet.fill}`}>
          <CategoryIcon name={categoryIcon} size={18} />
        </div>

        {/* Text descriptions */}
        <div className="flex flex-col min-w-0 pr-4">
          <span className="text-sm font-bold text-[#111111] truncate leading-tight">
            {displayTitle}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-[#707070] mt-1">
            <span>{formattedDate}</span>
            <span>•</span>
            <span>{timeString}</span>
            {note && (
              <>
                <span>•</span>
                <span className="truncate max-w-[120px] md:max-w-[200px]" title={note}>
                  {note}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Amount spent */}
      <span className="text-sm font-black text-red-500 shrink-0">
        -{formatAmount(amount)}
      </span>
    </div>
  );
}
