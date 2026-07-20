'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { expenseSchema, type ExpenseInput } from '@/utils/validation';
import { useCategories } from '@/hooks/useCategories';
import { useCreateExpense, useUpdateExpense, useExpenses } from '@/hooks/useExpenses';
import { Loader2, X } from 'lucide-react';
import { toDisplayAmount, toStorageAmount } from '@/utils/currency';

interface ExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: {
    id: string;
    title: string;
    amount: number; // Integer cents
    categoryId: string;
    date: string;
    note: string | null;
  } | null;
}

export function ExpenseDialog({ isOpen, onClose, expenseToEdit }: ExpenseDialogProps) {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: expenses } = useExpenses();
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();

  const isEdit = !!expenseToEdit;

  // Sort categories by recency of use
  const sortedCategories = useMemo(() => {
    if (!categories) return [];
    if (!expenses || expenses.length === 0) return categories;

    const recencyMap: Record<string, number> = {};
    expenses.forEach((exp: any) => {
      const time = new Date(exp.date).getTime();
      if (!recencyMap[exp.categoryId] || time > recencyMap[exp.categoryId]) {
        recencyMap[exp.categoryId] = time;
      }
    });

    return [...categories].sort((a: any, b: any) => {
      const timeA = recencyMap[a.id] || 0;
      const timeB = recencyMap[b.id] || 0;
      if (timeA !== timeB) {
        return timeB - timeA;
      }
      return a.name.localeCompare(b.name);
    });
  }, [categories, expenses]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: '',
      amount: undefined,
      categoryId: '',
      dateStr: new Date().toISOString().split('T')[0],
      note: '',
    },
  });

  // Hydrate fields if editing
  useEffect(() => {
    if (isOpen) {
      if (expenseToEdit) {
        setValue('title', expenseToEdit.title || '');
        setValue('amount', toDisplayAmount(expenseToEdit.amount)); // Display as decimal float
        setValue('categoryId', expenseToEdit.categoryId);
        setValue('dateStr', new Date(expenseToEdit.date).toISOString().split('T')[0]);
        setValue('note', expenseToEdit.note || '');
      } else {
        reset({
          title: '',
          amount: undefined,
          categoryId: sortedCategories.length > 0 ? sortedCategories[0].id : '',
          dateStr: new Date().toISOString().split('T')[0],
          note: '',
        });
      }
    }
  }, [isOpen, expenseToEdit, setValue, reset, sortedCategories]);

  const onSubmit = async (data: ExpenseInput) => {
    const amountCents = toStorageAmount(data.amount);

    try {
      if (isEdit && expenseToEdit) {
        await updateMutation.mutateAsync({
          id: expenseToEdit.id,
          data: {
            title: data.title || '',
            amount: amountCents,
            categoryId: data.categoryId,
            dateStr: data.dateStr,
            note: data.note || undefined,
          },
        });
      } else {
        await createMutation.mutateAsync({
          title: data.title || '',
          amount: amountCents,
          categoryId: data.categoryId,
          dateStr: data.dateStr,
          note: data.note || undefined,
        });
      }
      onClose();
    } catch {
      // Errors are handled inside the mutation hooks
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-[#EAEAEA] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md overflow-hidden shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#EAEAEA]">
          <h2 className="text-lg font-bold text-[#111111]">
            {isEdit ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#707070] hover:text-[#111111] p-1 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#707070]" htmlFor="form-title">
              Expense Title
            </label>
            <input
              id="form-title"
              type="text"
              placeholder="e.g. Weekly Grocery Run"
              className="w-full px-4 py-2.5 bg-[#F7F7F7] border border-[#EAEAEA] rounded-lg text-sm text-[#111111] placeholder-text-tertiary focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
              {...register('title')}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-xs text-danger font-medium">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#707070]" htmlFor="form-amount">
                Amount (INR)
              </label>
              <input
                id="form-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full px-4 py-2.5 bg-[#F7F7F7] border border-[#EAEAEA] rounded-lg text-sm text-[#111111] placeholder-text-tertiary focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                {...register('amount')}
                disabled={isSubmitting}
              />
              {errors.amount && (
                <p className="text-xs text-danger font-medium">{errors.amount.message}</p>
              )}
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#707070]" htmlFor="form-date">
                Transaction Date
              </label>
              <input
                id="form-date"
                type="date"
                className="w-full px-4 py-2.5 bg-[#F7F7F7] border border-[#EAEAEA] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                {...register('dateStr')}
                disabled={isSubmitting}
              />
              {errors.dateStr && (
                <p className="text-xs text-danger font-medium">{errors.dateStr.message}</p>
              )}
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#707070]" htmlFor="form-category">
              Category
            </label>
            <select
              id="form-category"
              className="w-full px-4 py-2.5 bg-[#F7F7F7] border border-[#EAEAEA] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors appearance-none"
              {...register('categoryId')}
              disabled={isSubmitting || categoriesLoading}
            >
              <option value="" disabled className="bg-white text-[#111111]">Select a category</option>
              {sortedCategories.map((cat: any) => (
                <option key={cat.id} value={cat.id} className="bg-white text-[#111111]">
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="text-xs text-danger font-medium">{errors.categoryId.message}</p>
            )}
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#707070]" htmlFor="form-note">
              Note (Optional)
            </label>
            <textarea
              id="form-note"
              rows={3}
              placeholder="Add description notes..."
              className="w-full px-4 py-2.5 bg-[#F7F7F7] border border-[#EAEAEA] rounded-lg text-sm text-[#111111] placeholder-text-tertiary focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors resize-none"
              {...register('note')}
              disabled={isSubmitting}
            />
            {errors.note && (
              <p className="text-xs text-danger font-medium">{errors.note.message}</p>
            )}
          </div>

          {/* Footer buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-[#EAEAEA]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#F7F7F7] hover:bg-[#EAEAEA] border border-[#EAEAEA] rounded-lg font-semibold text-sm text-[#707070] transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-black hover:bg-black/90 rounded-lg font-semibold text-sm text-white flex items-center gap-1.5 active:scale-[0.98] transition-all disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  Saving...
                </>
              ) : isEdit ? (
                'Save Changes'
              ) : (
                'Log Expense'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
