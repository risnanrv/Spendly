'use client';

import React from 'react';
import { formatAmount } from '@/utils/currency';
import { getCategoryColorClasses } from '@/utils/colors';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

export interface TopCategory {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
  progress: number; // 0 to 1
}

interface TopCategoriesListProps {
  topCategories: TopCategory[];
}

export function TopCategoriesList({ topCategories }: TopCategoriesListProps) {
  return (
    <div className="mb-6 flex flex-col">
      <h2 className="text-sm font-bold text-[#111111] uppercase tracking-wider mb-3">
        Top Categories
      </h2>
      <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5 shadow-sm">
        {topCategories.length === 0 ? (
          <p className="text-sm text-[#707070] text-center py-4">No categories data.</p>
        ) : (
          <div className="space-y-4">
            {topCategories.map((cat) => {
              const colorSet = getCategoryColorClasses(cat.color);

              return (
                <div key={cat.categoryId} className="flex flex-col">
                  {/* Category Info Header */}
                  <div className="flex justify-between items-center mb-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${colorSet.fill}`}>
                        <CategoryIcon name={cat.icon} size={11} />
                      </div>
                      <span className="font-bold text-[#111111] leading-tight">
                        {cat.name}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-bold text-[#111111]">
                        {formatAmount(cat.amount)}
                      </span>
                      <span className="text-[10px] text-[#707070]">
                        ({cat.percentage}%)
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Progress bar fill */}
                  <div className="w-full h-1.5 bg-[#F7F7F7] border border-[#EAEAEA] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${colorSet.fill}`}
                      style={{ width: `${cat.progress * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
