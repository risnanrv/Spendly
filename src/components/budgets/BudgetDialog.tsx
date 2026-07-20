'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { budgetSchema, type BudgetInput } from '@/utils/validation';
import { useSaveBudget } from '@/hooks/useBudgets';
import { getMonthName } from '@/utils/date';
import { Loader2, X } from 'lucide-react';
import { toDisplayAmount, toStorageAmount } from '@/utils/currency';

interface BudgetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  monthStr: string;
  currentAmount: number; // Integer cents
}

export function BudgetDialog({ isOpen, onClose, monthStr, currentAmount }: BudgetDialogProps) {
  const saveMutation = useSaveBudget();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      amount: undefined,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (currentAmount > 0) {
        setValue('amount', toDisplayAmount(currentAmount)); // Decimals representation
      } else {
        setValue('amount', undefined as any);
      }
    }
  }, [isOpen, currentAmount, setValue]);

  const onSubmit = async (data: BudgetInput) => {
    const amountCents = toStorageAmount(data.amount);
    try {
      await saveMutation.mutateAsync({
        monthStr,
        amount: amountCents,
      });
      onClose();
    } catch {
      // Errors handled in mutation hooks
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-[#EAEAEA] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#EAEAEA]">
          <h2 className="text-lg font-bold text-[#111111]">Configure Budget</h2>
          <button
            onClick={onClose}
            className="text-[#707070] hover:text-[#111111] p-1 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <p className="text-xs text-[#707070]">
            Set spending limit target for the month of <strong className="text-[#111111]">{getMonthName(monthStr)}</strong>.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#707070]" htmlFor="budget-amount">
              Budget Target (INR)
            </label>
            <input
              id="budget-amount"
              type="number"
              step="0.01"
              placeholder="e.g. 35000"
              className="w-full px-4 py-2.5 bg-[#F7F7F7] border border-[#EAEAEA] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
              {...register('amount')}
              disabled={isSubmitting}
            />
            {errors.amount && (
              <p className="text-xs text-danger font-medium">{errors.amount.message}</p>
            )}
          </div>

          {/* Buttons Footer */}
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
              ) : (
                'Save Target'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
