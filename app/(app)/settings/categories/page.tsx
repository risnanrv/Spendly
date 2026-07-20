'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCategories } from '@/hooks/useCategories';
import { getCategoryColorClasses } from '@/utils/colors';
import { formatAmount } from '@/utils/currency';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { CategoryDialog } from '@/components/categories/CategoryDialog';
import { CategoryDeleteDialog } from '@/components/categories/CategoryDeleteDialog';
import { Plus, Edit3, Trash2, ChevronLeft } from 'lucide-react';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { ErrorState } from '@/components/ui/ErrorState';
import { motion } from 'framer-motion';

export default function CategoriesSettingsPage() {
  const { data: categories, isLoading, isError, error, refetch } = useCategories();

  const sortedCategories = React.useMemo(() => {
    if (!categories) return [];
    return [...categories].sort((a: any, b: any) => (b.totalSpent || 0) - (a.totalSpent || 0));
  }, [categories]);

  // Modals States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<any | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<any | null>(null);

  const handleCreate = () => {
    setCategoryToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (category: any) => {
    setCategoryToEdit(category);
    setIsFormOpen(true);
  };

  const handleDelete = (category: any) => {
    setCategoryToDelete(category);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 select-none max-w-md mx-auto">
        <div className="h-6 w-36 rounded animate-shimmer" />
        <SkeletonList count={4} type="list-item" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={refetch} message={error?.message} />;
  }

  return (
    <div className="max-w-md mx-auto space-y-6 select-none pb-12">
      {/* Back Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link href="/settings" className="p-2 -ml-2 text-[#6B6B6B] hover:text-[#0A0A0A] transition-all">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-semibold text-[#0A0A0A]">Categories</h1>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleCreate}
          className="px-3.5 py-2.5 bg-[#0A0A0A] hover:bg-[#1C1C1C] transition-all rounded-xl font-semibold text-xs text-white flex items-center gap-1.5 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </motion.button>
      </div>

      {/* Grid listing */}
      <motion.div
        variants={{
          show: {
            transition: {
              staggerChildren: 0.04,
            },
          },
        }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-3"
      >
        {sortedCategories.map((cat: any) => {
          const colorSet = getCategoryColorClasses(cat.color);

          return (
            <motion.div
              key={cat.id}
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0 },
              }}
              whileHover={{ y: -1, shadow: '0 4px 12px rgba(0,0,0,0.02)' }}
              className="bg-white border border-[#E8E8E8] rounded-2xl p-4 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.01)] transition-all overflow-hidden relative group"
            >
              {/* Left Group Info */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 ${colorSet.fill}`}>
                  <CategoryIcon name={cat.icon} size={15} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-[#0A0A0A] leading-tight truncate">
                    {cat.name}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 text-[9px] text-[#6B6B6B] font-medium leading-none">
                    <span>{cat.expenseCount || 0} txn{cat.expenseCount === 1 ? '' : 's'}</span>
                  </div>
                </div>
              </div>

              {/* Right Group Actions & Lifetime Total */}
              <div className="flex items-center gap-3 shrink-0 relative pr-1">
                <div className="flex flex-col items-end group-hover:opacity-0 transition-opacity duration-150">
                  <span className="text-xs font-bold text-[#0A0A0A] leading-none">
                    {formatAmount(cat.totalSpent || 0)}
                  </span>

                </div>

                {/* Sliding Actions on Hover */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto flex items-center gap-1 transition-opacity duration-150 bg-white pl-2">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="p-1.5 text-[#6B6B6B] hover:text-[#0A0A0A] hover:bg-[#F5F5F5] rounded-lg transition-all"
                    title="Edit"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="p-1.5 text-[#6B6B6B] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Dialog Modals */}
      <CategoryDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        categoryToEdit={categoryToEdit}
      />

      <CategoryDeleteDialog
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        category={categoryToDelete}
        allCategories={sortedCategories}
      />
    </div>
  );
}
