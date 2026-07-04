'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useBudgetDetails, useBudgetHistory, useDeleteBudget } from '@/hooks/useBudgets';
import { getMonthName, getMonthStr } from '@/utils/date';
import { formatAmount } from '@/utils/currency';
import { MonthNavigator } from '@/components/dashboard/MonthNavigator';
import { BudgetPreview } from '@/components/dashboard/BudgetPreview';
import { BudgetDialog } from '@/components/budgets/BudgetDialog';
import { DeleteConfirmDialog } from '@/components/expenses/DeleteConfirmDialog';
import { Edit3, Trash2, Plus, Loader2, AlertTriangle, ChevronLeft } from 'lucide-react';

export default function BudgetsSettingsPage() {
  const deleteMutation = useDeleteBudget();

  // Filters State
  const [monthStr, setMonthStr] = useState<string>(getMonthStr(new Date()));

  // Modals State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Fetch queries
  const { data: details, isLoading, isError, error } = useBudgetDetails(monthStr);
  const { data: history, isLoading: historyLoading } = useBudgetHistory();

  const handleEdit = () => {
    setIsFormOpen(true);
  };

  const handleDeleteConfirm = async () => {
    await deleteMutation.mutateAsync(monthStr);
    setIsDeleteConfirmOpen(false);
  };

  // Compute remaining days in the selected month client-side
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#707070] gap-3 select-none">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
        <span className="text-sm font-semibold">Loading budget details...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 bg-[#F7F7F7] border border-[#EAEAEA] rounded-2xl max-w-md mx-auto text-center select-none">
        <AlertTriangle className="h-12 w-12 text-red-500 animate-bounce" />
        <h2 className="text-lg font-bold text-[#111111]">Failed to load budget</h2>
        <p className="text-sm text-[#707070]">
          {error?.message || 'Database connection error'}
        </p>
      </div>
    );
  }

  const hasBudget = !!details && details.budget > 0;

  return (
    <div className="max-w-md mx-auto space-y-6 select-none pb-12">
      {/* Back Header */}
      <div className="flex items-center gap-2">
        <Link href="/settings" className="p-2 -ml-2 text-[#707070] hover:text-[#111111] transition-all">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-[#111111]">Manage Budgets</h1>
      </div>

      {/* Month Navigator */}
      <MonthNavigator monthStr={monthStr} onChangeMonth={setMonthStr} />

      {/* Active Budget Preview / Setup Card */}
      {hasBudget ? (
        <div className="space-y-4">
          <BudgetPreview
            hasBudget={true}
            budgetAmount={details.budget}
            spent={details.spent}
            remaining={details.remaining}
            progress={details.percentage / 100}
            status={details.status}
            remainingDays={remainingDays}
            monthName={getMonthName(monthStr)}
          />

          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="flex-1 py-2.5 bg-[#F7F7F7] border border-[#EAEAEA] hover:bg-[#EAEAEA]/30 rounded-xl font-semibold text-sm text-[#111111] flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
            >
              <Edit3 className="h-4 w-4 text-[#707070]" />
              Modify Target
            </button>
            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="flex-1 py-2.5 bg-red-50 border border-red-100 hover:bg-red-100/55 rounded-xl font-semibold text-sm text-red-500 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
              Remove Target
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#F7F7F7] border border-[#EAEAEA] rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
          <p className="text-sm text-[#707070] mb-4">
            No spending limit configured for {getMonthName(monthStr)}.
          </p>
          <button
            onClick={handleEdit}
            className="px-5 py-2.5 bg-black hover:bg-black/90 rounded-lg font-semibold text-sm text-white flex items-center gap-1.5 active:scale-[0.98] transition-all"
          >
            <Plus className="h-4.5 w-4.5" />
            Set Budget Target
          </button>
        </div>
      )}

      {/* History section */}
      <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
          Budget History (Last 6 Months)
        </h2>

        {historyLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-black" />
          </div>
        ) : !history || history.length === 0 ? (
          <p className="text-xs text-[#707070] text-center py-4">No budget records found.</p>
        ) : (
          <div className="divide-y divide-[#EAEAEA]">
            {history.map((item: any) => {
              const spentPct = item.budget > 0 ? Math.round((item.spent / item.budget) * 100) : 0;
              const isExceeded = item.spent > item.budget;

              return (
                <div key={item.month} className="py-3 flex justify-between items-center text-sm first:pt-0 last:pb-0">
                  <div className="flex flex-col">
                    <span className="font-bold text-[#111111]">
                      {new Date(item.month + '-02').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                    </span>
                    <span className="text-[10px] text-[#707070] mt-0.5">
                      Spent {formatAmount(item.spent)} of {formatAmount(item.budget)}
                    </span>
                  </div>
                  <span className={`text-xs font-black uppercase px-2 py-0.5 rounded ${
                    isExceeded
                      ? 'bg-red-50 text-red-500'
                      : 'bg-green-50 text-green-600'
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
