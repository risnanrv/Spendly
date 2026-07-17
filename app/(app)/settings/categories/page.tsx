'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCategories } from '@/hooks/useCategories';
import { getCategoryColorClasses } from '@/utils/colors';
import { formatAmount } from '@/utils/currency';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { CategoryDialog } from '@/components/categories/CategoryDialog';
import { CategoryDeleteDialog } from '@/components/categories/CategoryDeleteDialog';
import { Plus, Edit3, Trash2, Loader2, AlertTriangle, ChevronLeft } from 'lucide-react';

export default function CategoriesSettingsPage() {
  const { data: categories, isLoading, isError, error } = useCategories();

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#707070] gap-3 select-none">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
        <span className="text-sm font-semibold">Loading categories...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 bg-[#F7F7F7] border border-[#EAEAEA] rounded-2xl max-w-md mx-auto text-center select-none">
        <AlertTriangle className="h-10 w-10 text-red-500 animate-bounce" />
        <h3 className="text-base font-bold text-[#111111]">Failed to load categories</h3>
        <p className="text-xs text-[#707070]">{error?.message || 'Unexpected database error'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 select-none pb-12">
      {/* Back Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link href="/settings" className="p-2 -ml-2 text-[#707070] hover:text-[#111111] transition-all">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-[#111111]">Categories</h1>
        </div>
        <button
          onClick={handleCreate}
          className="px-3.5 py-2 bg-black hover:bg-black/90 transition-all rounded-lg font-semibold text-xs text-white flex items-center gap-1.5 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4 text-white" />
          Create
        </button>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 gap-3">
        {categories?.map((cat: any) => {
          const colorSet = getCategoryColorClasses(cat.color);

          return (
            <div
              key={cat.id}
              className="bg-white border border-[#EAEAEA] rounded-2xl p-4 shadow-sm flex items-center justify-between transition-all"
            >
              {/* Left Group Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0 ${colorSet.fill}`}>
                  <CategoryIcon name={cat.icon} size={16} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-[#111111] leading-tight truncate">
                    {cat.name}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {cat.isSystem ? (
                      <span className="text-[8px] font-black uppercase text-[#707070] bg-[#F7F7F7] border border-[#EAEAEA] px-1 py-0.5 rounded">
                        System
                      </span>
                    ) : (
                      <span className="text-[8px] font-black uppercase text-[#888888] bg-[#F7F7F7] border border-[#EAEAEA] px-1 py-0.5 rounded">
                        Custom
                      </span>
                    )}
                    <span className="text-[9px] text-[#707070] font-semibold">
                      • {cat.expenseCount || 0} txn{cat.expenseCount === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Group Actions & Lifetime Total */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Total Stats */}
                <div className="flex flex-col items-end">
                  <span className="text-xs font-black text-[#111111] leading-none">
                    ₹{formatAmount(cat.totalSpent || 0)}
                  </span>
                  <span className="text-[8px] text-[#707070] uppercase font-bold tracking-wider mt-1">
                    Lifetime
                  </span>
                </div>

                <div className="flex items-center gap-0.5 border-l border-[#EAEAEA] pl-2">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="p-1.5 text-[#707070] hover:text-black rounded-lg hover:bg-[#F7F7F7] transition-all"
                    title="Edit Category"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  {!cat.isSystem && (
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-1.5 text-[#707070] hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"
                      title="Delete Category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
        allCategories={categories || []}
      />
    </div>
  );
}
