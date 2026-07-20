'use client';

import React from 'react';
import { formatAmount } from '@/utils/currency';
import { getCategoryColorClasses } from '@/utils/colors';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { useCategories } from '@/hooks/useCategories';
import { motion } from 'framer-motion';
import { Edit3, Trash2 } from 'lucide-react';

interface ExpenseCardProps {
  id?: string;
  title: string | null;
  note: string | null;
  amount: number; // Integer cents
  categoryId: string;
  date: Date | string;
  onClick?: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export function ExpenseCard({
  title,
  note,
  amount,
  categoryId,
  date,
  onClick,
  onEdit,
  onDelete,
}: ExpenseCardProps) {
  const { data: categories } = useCategories();

  // Find category details
  const category = (categories || []).find((c: any) => c.id === categoryId);
  const categoryColor = category?.color || 'slate';
  const categoryName = category?.name || 'Category';
  const categoryIcon = category?.icon || 'grid';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

  // Monochrome colors primarily, category colors are only a small accent dot
  const colorSet = getCategoryColorClasses(categoryColor);

  const trimmedTitle = (title || '').trim();
  const displayTitle = (trimmedTitle === '' || trimmedTitle.toLowerCase() === 'untitled') ? categoryName : trimmedTitle;

  return (
    <motion.div
      whileHover={{ y: -2, shadow: '0 4px 20px rgba(0,0,0,0.04)' }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className="group relative bg-white border border-[#E8E8E8] rounded-2xl p-4 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all cursor-pointer overflow-hidden"
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Category Circle - Monochrome style with tiny colored indicator dot */}
        <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] border border-[#E8E8E8] flex items-center justify-center text-[#0A0A0A] shrink-0 relative">
          <CategoryIcon name={categoryIcon} size={16} />
          {/* Subtle category color indicator dot */}
          <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${colorSet.fill}`} />
        </div>

        {/* Text descriptions */}
        <div className="flex flex-col min-w-0 pr-4">
          <span className="text-xs font-semibold text-[#0A0A0A] truncate leading-tight">
            {displayTitle}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-[#6B6B6B] mt-1 font-medium">
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

      {/* Amount and Hover Actions container */}
      <div className="flex items-center gap-3 shrink-0 relative">
        <span className="text-xs font-bold text-[#0A0A0A] group-hover:opacity-0 transition-opacity duration-150">
          -{formatAmount(amount)}
        </span>

        {/* Sliding hover actions on Desktop */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto flex items-center gap-1 transition-opacity duration-150 bg-white pl-2">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(e);
              }}
              className="p-1.5 text-[#6B6B6B] hover:text-[#0A0A0A] hover:bg-[#F5F5F5] rounded-lg transition-all"
              title="Edit"
            >
              <Edit3 className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(e);
              }}
              className="p-1.5 text-[#6B6B6B] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
