'use client';

import React, { useState, useEffect } from 'react';
import { useDeleteCategory } from '@/hooks/useCategories';
import { Loader2, AlertTriangle, ChevronDown, CheckSquare, Square } from 'lucide-react';
import { useToastStore } from '@/stores/toast.store';

interface BulkDeleteCategoriesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  allCategories: Array<{
    id: string;
    name: string;
    expenseCount?: number;
  }>;
  onSuccess?: () => void;
}

export function BulkDeleteCategoriesDialog({
  isOpen,
  onClose,
  allCategories,
  onSuccess,
}: BulkDeleteCategoriesDialogProps) {
  const deleteMutation = useDeleteCategory();
  const { addToast } = useToastStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reassignToId, setReassignToId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeCategories = allCategories;

  // Set default reassign category when list or selections change
  useEffect(() => {
    const unselected = activeCategories.filter((c) => !selectedIds.includes(c.id));
    if (unselected.length > 0) {
      setReassignToId(unselected[0].id);
    } else {
      setReassignToId('');
    }
  }, [selectedIds, activeCategories]);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0) {
      addToast('Please select at least one category to delete.', 'danger');
      return;
    }

    if (selectedIds.length >= activeCategories.length) {
      addToast('Cannot delete all categories. At least one category must remain.', 'danger');
      return;
    }

    if (!reassignToId) {
      addToast('Please select a valid replacement category.', 'danger');
      return;
    }

    setIsSubmitting(true);
    try {
      // Loop over each selected category and delete it (reassigning expenses)
      // CategoryService.deleteCategory will reassign expenses
      for (const catId of selectedIds) {
        await deleteMutation.mutateAsync({
          id: catId,
          reassignToId,
        });
      }
      addToast('Selected categories deleted successfully.', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      addToast(err.message || 'Bulk deletion failed.', 'danger');
    } finally {
      setIsSubmitting(false);
      setSelectedIds([]);
    }
  };

  if (!isOpen) return null;

  const unselectedCategories = activeCategories.filter((c) => !selectedIds.includes(c.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-[#EAEAEA] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        {/* Title */}
        <div className="p-6 pb-2 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h3 className="text-base font-bold text-[#111111] leading-tight">
              Delete Selected Categories
            </h3>
          </div>
          <p className="text-xs text-[#707070]">
            Select one or multiple categories to permanently delete. Remaining categories: {activeCategories.length - selectedIds.length}
          </p>
        </div>

        {/* Checkbox Category list scroll section */}
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-2">
          {activeCategories.map((c) => {
            const isSelected = selectedIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleSelect(c.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all text-xs font-semibold ${
                  isSelected
                    ? 'border-red-200 bg-red-50/50 text-red-700'
                    : 'border-[#EAEAEA] bg-[#F7F7F7] text-[#111111] hover:border-[#CCCCCC]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isSelected ? (
                    <CheckSquare className="h-4.5 w-4.5 text-red-500 shrink-0" />
                  ) : (
                    <Square className="h-4.5 w-4.5 text-[#707070] shrink-0" />
                  )}
                  <span>{c.name}</span>
                </div>
                {c.expenseCount !== undefined && (
                  <span className={`text-[10px] ${isSelected ? 'text-red-500' : 'text-[#707070]'}`}>
                    {c.expenseCount} txn{c.expenseCount === 1 ? '' : 's'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Reassignment choice */}
        {selectedIds.length > 0 && (
          <div className="p-6 pt-2 pb-4 border-t border-[#EAEAEA] bg-[#F9F9F9] shrink-0 space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#707070] block">
              Reassign transactions to:
            </label>
            {unselectedCategories.length > 0 ? (
              <div className="relative">
                <select
                  value={reassignToId}
                  onChange={(e) => setReassignToId(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 bg-white border border-[#EAEAEA] rounded-lg text-xs font-semibold text-[#111111] focus:outline-none focus:border-black transition-colors appearance-none cursor-pointer"
                >
                  {unselectedCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#707070] pointer-events-none" />
              </div>
            ) : (
              <p className="text-[10px] font-bold text-red-500">
                You selected all categories. You must keep at least one category!
              </p>
            )}
          </div>
        )}

        {/* Action Footer */}
        <div className="px-6 py-4 bg-[#F7F7F7] border-t border-[#EAEAEA] flex gap-3 justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-[#F7F7F7] border border-[#EAEAEA] rounded-lg font-semibold text-xs text-[#707070] transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold text-xs text-white flex items-center gap-1.5 active:scale-[0.98] transition-all disabled:opacity-50"
            disabled={isSubmitting || selectedIds.length === 0 || selectedIds.length >= activeCategories.length}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                Deleting...
              </>
            ) : (
              'Delete Selected'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
