'use client';

import React, { useState, useEffect } from 'react';
import { useDeleteCategory } from '@/hooks/useCategories';
import { Loader2, AlertTriangle, ChevronDown } from 'lucide-react';

interface CategoryDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category: {
    id: string;
    name: string;
    expenseCount?: number;
  } | null;
  allCategories: Array<{
    id: string;
    name: string;
  }>;
}

export function CategoryDeleteDialog({
  isOpen,
  onClose,
  category,
  allCategories,
}: CategoryDeleteDialogProps) {
  const deleteMutation = useDeleteCategory();
  const [reassignToId, setReassignToId] = useState<string>('');

  const hasExpenses = !!category && (category.expenseCount ?? 0) > 0;
  const otherCategories = allCategories.filter((c) => c.id !== category?.id);

  // Set default reassign category
  useEffect(() => {
    const otherCategoriesList = allCategories.filter((c) => c.id !== category?.id);
    if (isOpen && otherCategoriesList.length > 0) {
      setReassignToId(otherCategoriesList[0].id);
    }
  }, [isOpen, category, allCategories]);

  const handleConfirm = async () => {
    if (!category) return;
    try {
      await deleteMutation.mutateAsync({
        id: category.id,
        reassignToId: hasExpenses ? reassignToId : undefined,
      });
      onClose();
    } catch {
      // Error alerts handled by mutation hooks
    }
  };

  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-[#EAEAEA] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Warning Indicator */}
        <div className="p-6 pb-4 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-[#111111] leading-tight">
            Delete Category &ldquo;{category.name}&rdquo;
          </h3>
          
          {hasExpenses ? (
            <div className="mt-3 text-left w-full space-y-3">
              <p className="text-sm text-[#707070]">
                This category contains <strong className="text-[#111111]">{category.expenseCount} transactions</strong>. 
                Please choose a replacement category to transfer these transactions:
              </p>
              
              <div className="relative">
                <select
                  value={reassignToId}
                  onChange={(e) => setReassignToId(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 bg-[#F7F7F7] border border-[#EAEAEA] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-black transition-colors appearance-none cursor-pointer"
                >
                  {otherCategories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-white text-black">
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#707070] pointer-events-none" />
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#707070] mt-2">
              Are you sure you want to delete this category? This action cannot be undone.
            </p>
          )}
        </div>

        {/* Buttons Action Footer */}
        <div className="px-6 py-4 bg-[#F7F7F7] border-t border-[#EAEAEA] flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-[#F7F7F7] border border-[#EAEAEA] rounded-lg font-semibold text-sm text-[#707070] transition-colors"
            disabled={deleteMutation.isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold text-sm text-white flex items-center gap-1.5 active:scale-[0.98] transition-all disabled:opacity-50"
            disabled={deleteMutation.isPending || (hasExpenses && !reassignToId)}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                Deleting...
              </>
            ) : (
              'Confirm Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
