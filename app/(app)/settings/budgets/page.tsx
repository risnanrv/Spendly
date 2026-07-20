'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useBudgetDetails, useBudgetHistory, useDeleteBudget } from '@/hooks/useBudgets';
import { getMonthName, getMonthStr } from '@/utils/date';
import { formatAmount } from '@/utils/currency';
import { BudgetDialog } from '@/components/budgets/BudgetDialog';
import { DeleteConfirmDialog } from '@/components/expenses/DeleteConfirmDialog';
import { Edit3, Trash2, Plus, AlertTriangle, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { ErrorState } from '@/components/ui/ErrorState';
import { motion } from 'framer-motion';


export default function BudgetsSettingsPage() {
  const deleteMutation = useDeleteBudget();

  // Filters State
  const [monthStr, setMonthStr] = useState<string>(getMonthStr(new Date()));

  // Modals State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Fetch queries
  const { data: details, isLoading, isError, error, refetch } = useBudgetDetails(monthStr);
  const { data: history, isLoading: historyLoading } = useBudgetHistory();

  const handleEdit = () => {
    setIsFormOpen(true);
  };

  const handleDeleteConfirm = async () => {
    await deleteMutation.mutateAsync(monthStr);
    setIsDeleteConfirmOpen(false);
  };

  // Navigate months
  const handlePrevMonth = () => {
    const [year, month] = monthStr.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    setMonthStr(getMonthStr(prevDate));
  };

  const handleNextMonth = () => {
    const [year, month] = monthStr.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    setMonthStr(getMonthStr(nextDate));
  };

  // Compute remaining days in the selected month
  const remainingDays = useMemo(() => {
    const [year, month] = monthStr.split('-').map(Number);
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && (today.getMonth() + 1) === month;

    if (isCurrentMonth) {
      return Math.max(0, totalDaysInMonth - today.getDate());
    }
    const isPastMonth = new Date(year, month - 1, 1) < new Date(today.getFullYear(), today.getMonth(), 1);
    return isPastMonth ? 0 : totalDaysInMonth;
  }, [monthStr]);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 select-none max-w-md mx-auto">
        <div className="h-6 w-36 rounded animate-shimmer" />
        <SkeletonCard type="budget" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={refetch} message={error?.message} />;
  }

  const hasBudget = !!details && details.budget > 0;
  const progressPercent = hasBudget ? Math.min(100, details.percentage) : 0;

  return (
    <div className="max-w-md mx-auto space-y-6 select-none pb-12">
      {/* Back Header */}
      <div className="flex items-center gap-2">
        <Link href="/settings" className="p-2 -ml-2 text-[#6B6B6B] hover:text-[#0A0A0A] transition-all">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-base font-semibold text-[#0A0A0A]">Monthly Budgets</h1>
      </div>

      {/* Modern minimal month switcher */}
      <div className="bg-white border border-[#E8E8E8] rounded-2xl p-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          className="p-1.5 hover:bg-[#F5F5F5] text-[#6B6B6B] hover:text-[#0A0A0A] rounded-xl transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0A0A0A]">
          <Calendar className="h-3.5 w-3.5 text-[#6B6B6B]" />
          <span>{getMonthName(monthStr)}</span>
        </div>
        <button
          onClick={handleNextMonth}
          className="p-1.5 hover:bg-[#F5F5F5] text-[#6B6B6B] hover:text-[#0A0A0A] rounded-xl transition-all"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Active Budget Card */}
      {hasBudget ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-white border border-[#E8E8E8] rounded-3xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
                  Spent of Limit
                </span>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-2xl font-black text-[#0A0A0A]">
                    {formatAmount(details.spent)}
                  </span>
                  <span className="text-xs text-[#6B6B6B]">
                    of {formatAmount(details.budget)}
                  </span>
                </div>
              </div>
              <span className={`text-[8px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                details.status === 'exceeded'
                  ? 'text-red-600 bg-red-50 border-red-200'
                  : details.status === 'approaching'
                  ? 'text-amber-600 bg-amber-50 border-amber-200'
                  : 'text-[#0A0A0A] bg-[#F5F5F5] border-[#E8E8E8]'
              }`}>
                {details.status}
              </span>
            </div>

            {/* Circular or Linear gauge */}
            <div className="space-y-2">
              <div className="w-full h-2.5 bg-[#F5F5F5] border border-[#E8E8E8] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8 }}
                  className={`h-full rounded-full ${
                    details.status === 'exceeded'
                      ? 'bg-red-500'
                      : details.status === 'approaching'
                      ? 'bg-amber-500'
                      : 'bg-[#0A0A0A]'
                  }`}
                />
              </div>
              <div className="flex justify-between text-[10px] font-semibold text-[#6B6B6B]">
                <span>Remaining: {formatAmount(details.remaining)}</span>
                <span>{remainingDays} days left</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleEdit}
              className="flex-1 py-3 bg-white border border-[#E8E8E8] hover:bg-[#F5F5F5] rounded-xl font-semibold text-xs text-[#0A0A0A] flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
            >
              <Edit3 className="h-4 w-4" />
              Adjust Limit
            </button>
            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="flex-1 py-3 bg-white border border-red-100 hover:bg-red-50 text-red-500 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
            >
              <Trash2 className="h-4 w-4" />
              Remove Target
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="bg-white border border-[#E8E8E8] rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[220px]">
          <span className="text-xs text-[#6B6B6B] mb-5">
            No budget set for {getMonthName(monthStr)}
          </span>
          <button
            onClick={handleEdit}
            className="px-5 py-3 bg-[#0A0A0A] hover:bg-[#1C1C1C] rounded-xl font-semibold text-xs text-white flex items-center gap-1.5 active:scale-[0.98] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
          >
            <Plus className="h-4 w-4" />
            Set Budget Target
          </button>
        </div>
      )}

      {/* History section */}
      <div className="bg-white border border-[#E8E8E8] rounded-3xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
          Timeline History
        </span>

        {historyLoading ? (
          <div className="flex justify-center py-6">
            <span className="w-4 h-4 rounded-full border-2 border-neutral-300 border-t-neutral-800 animate-spin" />
          </div>
        ) : !history || history.length === 0 ? (
          <p className="text-[10px] text-[#6B6B6B] italic text-center py-4">No budget history available</p>
        ) : (
          <div className="divide-y divide-[#E8E8E8] text-xs">
            {history.map((item: any) => {
              const spentPct = item.budget > 0 ? Math.round((item.spent / item.budget) * 100) : 0;
              const isExceeded = item.spent > item.budget;

              return (
                <div key={item.month} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#0A0A0A]">
                      {new Date(item.month + '-02').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                    </span>
                    <span className="text-[10px] text-[#6B6B6B] mt-1 font-medium">
                      Spent {formatAmount(item.spent)} of {formatAmount(item.budget)}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    isExceeded
                      ? 'bg-red-50 text-red-500 border-red-100'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                    {spentPct}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog Form Container */}
      <BudgetDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        monthStr={monthStr}
        currentAmount={details?.budget || 0}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Remove Budget Target"
        description={`Are you sure you want to delete the budget limit target for ${getMonthName(monthStr)}? This will remove safety indicator progress bars on dashboard views.`}
        isSubmitting={deleteMutation.isPending}
      />
    </div>
  );
}
